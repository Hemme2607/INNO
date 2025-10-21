import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback, useRef } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function InboxScreen() {
  const { getToken, sessionId } = useAuth();
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  const MIN_FETCH_INTERVAL = 60 * 1000; //så vi ikke spammer Clerk

  const fetchInbox = useCallback(
    async ({ showLoader = true, force = false } = {}) => {
      if (!sessionId) {
        setInboxItems([]);
        setLoading(false);
        return;
      }

      if (isFetchingRef.current) {
        return;
      }

      const now = Date.now();
      if (!force && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
        // Har allerede hentet indenfor intervallet → spring over
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setErrorMessage(null);
      isFetchingRef.current = true;

      try {
        const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl) {
          throw new Error(
            "Supabase URL mangler. Sæt EXPO_PUBLIC_SUPABASE_URL i din app-konfiguration."
          );
        }
        if (!supabaseAnonKey) {
          throw new Error(
            "Supabase anon nøgle mangler. Sæt EXPO_PUBLIC_SUPABASE_ANON_KEY i din app-konfiguration."
          );
        }

        const sessionToken = await getToken();
        if (!sessionToken) {
          throw new Error(
            "Kunne ikke hente Clerk session token. Log ind igen og prøv senere."
          );
        }

        // Hent data via edge function (leverer allerede normaliserede felter)
        const response = await fetch(
          `${supabaseUrl.replace(/\/$/, "")}/functions/v1/gmail-list`,
          {
            headers: {
              Authorization: `Bearer ${sessionToken}`,
              apikey: supabaseAnonKey,
            },
          }
        );

        if (!response.ok) {
          const errorBody = await response.text();
          if (response.status === 429) {
            throw new Error(
              "Vi har ramt Clerk rate limit. Vent et øjeblik og prøv igen."
            );
          }
          throw new Error(
            `Kunne ikke hente mails fra Edge Function: ${
              errorBody || `HTTP ${response.status}`
            }`
          );
        }

        const payload = await response.json();
        const rawItems = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload?.messages)
          ? payload.messages
          : [];

        const mapped = rawItems.map((message) => {
          // Forvent både "from" og "sender" afhængigt af backend-version
          const rawSender =
            typeof message?.sender === "string"
              ? message.sender
              : typeof message?.from === "string"
              ? message.from
              : "";

          const cleanSender = rawSender.replace(/<.*?>/g, "").trim();

          let timeLabel = "";
          const dateSource =
            message?.date ??
            message?.internalDate ??
            message?.receivedAt ??
            null;
          // Gmail kan give unix-timestamp som string → parse det
          if (dateSource) {
            const normalizedDate =
              typeof dateSource === "string" && /^\d+$/.test(dateSource)
                ? Number(dateSource)
                : dateSource;
            const parsedDate = new Date(normalizedDate);
            if (!Number.isNaN(parsedDate.getTime())) {
              timeLabel = parsedDate.toLocaleString("da-DK", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              });
            }
          }

          return {
            id: message?.id ?? Math.random().toString(36),
            sender: cleanSender || "Ukendt afsender",
            subject:
              typeof message?.subject === "string"
                ? message.subject
                : "(ingen emne)",
            preview:
              typeof message?.preview === "string"
                ? message.preview
                : typeof message?.snippet === "string"
                ? message.snippet
                : "",
            time: timeLabel,
          };
        });

        setInboxItems(mapped);
      } catch (error) {
        setInboxItems([]);
        setErrorMessage(error.message);
      } finally {
        isFetchingRef.current = false;
        if (showLoader) {
          setLoading(false);
        }
        lastFetchRef.current = Date.now();
      }
    },
    [getToken, sessionId]
  );

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchInbox({ showLoader: false, force: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchInbox]);

  // Render-funktion for hver indbakke-post
  const renderItem = ({ item }) => (
    <View style={GlobalStyles.inboxRow}>
      <View style={GlobalStyles.inboxAvatar}>
        <Text style={GlobalStyles.inboxAvatarLabel}>
          {(item.sender ?? "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={GlobalStyles.inboxRowContent}>
        <View style={GlobalStyles.inboxRowHeader}>
          <Text style={GlobalStyles.inboxSender} numberOfLines={1}>
            {item.sender ?? "Afsender"}
          </Text>
          <Text style={GlobalStyles.inboxTime}>{item.time ?? ""}</Text>
        </View>
        <Text style={GlobalStyles.inboxSubject} numberOfLines={1}>
          {item.subject ?? ""}
        </Text>
        <Text style={GlobalStyles.inboxPreview} numberOfLines={2}>
          {item.preview ?? ""}
        </Text>
      </View>
    </View>
  );

  // Opbygning af InboxScreen-komponenten
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={GlobalStyles.inboxScreen}
    >
      <View style={GlobalStyles.inboxTopDivider} />
      <View style={GlobalStyles.inboxHeader}>
        <View>
          <Text style={GlobalStyles.inboxHeading}>Indbakke</Text>
          <Text style={GlobalStyles.inboxSubtitle}>
            Se nye mails og AI-klargjorte svar her.
          </Text>
        </View>
        <View style={GlobalStyles.inboxHeaderButton}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.text}
          />
        </View>
      </View>


      <FlatList
        data={inboxItems}
        keyExtractor={(item, index) => item.id ?? String(index)}
        renderItem={renderItem}
        contentContainerStyle={[
          GlobalStyles.inboxListContent,
          inboxItems.length === 0 && GlobalStyles.inboxListEmptyContent,
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        ItemSeparatorComponent={() => <View style={GlobalStyles.inboxSeparator} />}
        ListEmptyComponent={
          <View style={GlobalStyles.inboxEmptyState}>
            {loading ? (
              <>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={GlobalStyles.inboxEmptyHeading}>
                  Henter dine mails
                </Text>
                <Text style={GlobalStyles.inboxEmptySubtitle}>
                  Vi forbinder til Gmail og indlæser dine seneste beskeder.
                </Text>
              </>
            ) : errorMessage ? (
              <>
                <Ionicons
                  name="alert-circle-outline"
                  size={36}
                  color={COLORS.primary}
                />
                <Text style={GlobalStyles.inboxEmptyHeading}>
                  Kunne ikke hente mails
                </Text>
                <Text style={GlobalStyles.inboxEmptySubtitle}>
                  {errorMessage}
                </Text>
              </>
            ) : sessionId ? (
              <>
                <Ionicons
                  name="mail-open-outline"
                  size={36}
                  color={COLORS.primary}
                />
                <Text style={GlobalStyles.inboxEmptyHeading}>
                  Din indbakke er tom
                </Text>
                <Text style={GlobalStyles.inboxEmptySubtitle}>
                  Når Sona henter mails fra dine kanaler, vises de her klar til at
                  blive behandlet.
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="log-in-outline"
                  size={36}
                  color={COLORS.primary}
                />
                <Text style={GlobalStyles.inboxEmptyHeading}>
                  Log ind for at se Gmail
                </Text>
                <Text style={GlobalStyles.inboxEmptySubtitle}>
                  Brug Google login via Clerk for at forbinde din konto.
                </Text>
              </>
            )}
          </View>
        }
      />
    </LinearGradient>
  );
}
