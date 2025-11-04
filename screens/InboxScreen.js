import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

const MAIL_PROVIDERS = [
  {
    id: "gmail",
    label: "Gmail",
    functionName: "gmail-list",
    providerKey: "oauth_google",
  },
  {
    id: "outlook",
    label: "Microsoft",
    functionName: "outlook-list",
    providerKey: "oauth_microsoft",
  },
];

export default function InboxScreen() {
  const { getToken, sessionId } = useAuth();
  const { user } = useUser();
  const [creatingDraftId, setCreatingDraftId] = useState(null);
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeMailProvider, setActiveMailProvider] = useState(null);
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  const MIN_FETCH_INTERVAL = 60 * 1000; //så vi ikke spammer Clerk

  const prioritizedProviders = useMemo(() => {
    const connected = new Set(
      (user?.externalAccounts ?? [])
        .map((account) => account?.provider)
        .filter((provider) => typeof provider === "string")
    );

    const connectedMail = MAIL_PROVIDERS.filter((provider) =>
      connected.has(provider.providerKey)
    );
    const fallbackMail = MAIL_PROVIDERS.filter(
      (provider) => !connected.has(provider.providerKey)
    );

    return [...connectedMail, ...fallbackMail];
  }, [user]);

  const activeProviderLabel = useMemo(() => {
    const provider = MAIL_PROVIDERS.find((item) => item.id === activeMailProvider);
    return provider?.label ?? null;
  }, [activeMailProvider]);

  const fetchInbox = useCallback(
    async ({ showLoader = true, force = false } = {}) => {
      if (!sessionId) {
        setInboxItems([]);
        setActiveMailProvider(null);
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

        const baseUrl = supabaseUrl.replace(/\/$/, "");
        let fetched = false;
        let lastError = null;

        for (const provider of prioritizedProviders) {
          const endpoint = `${baseUrl}/functions/v1/${provider.functionName}`;
          try {
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${sessionToken}`,
                apikey: supabaseAnonKey,
              },
            });

            if (!response.ok) {
              const errorBody = await response.text();
              if (response.status === 429) {
                throw new Error("Vi har ramt Clerk rate limit. Vent et øjeblik og prøv igen.");
              }
              const message =
                errorBody?.trim() || `HTTP ${response.status}`;
              const error = new Error(
                `Kunne ikke hente mails fra ${provider.label}: ${message}`
              );
              if ([401, 403, 404].includes(response.status)) {
                lastError = error;
                continue;
              }
              throw error;
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
              // Gmail og Outlook kan give unix-timestamp eller ISO string → parse det
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
                  // Keep both a cleaned sender for display and the raw header for extracting email addresses
                  rawFrom: (typeof message?.from === "string" ? message.from : (typeof message?.sender === "string" ? message.sender : "")),
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
            setActiveMailProvider(provider.id);
            fetched = true;
            break;
          } catch (providerError) {
            lastError =
              providerError instanceof Error
                ? providerError
                : new Error(String(providerError));
          }
        }

        if (!fetched) {
          setActiveMailProvider(null);
          if (lastError) {
            throw lastError;
          }
          throw new Error("Kunne ikke hente mails fra nogen mailudbyder.");
        }
      } catch (error) {
        setInboxItems([]);
        setActiveMailProvider(null);
        setErrorMessage(error.message);
      } finally {
        isFetchingRef.current = false;
        if (showLoader) {
          setLoading(false);
        }
        lastFetchRef.current = Date.now();
      }
    },
    [getToken, sessionId, prioritizedProviders]
  );

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const functionsBase = supabaseUrl ? `${supabaseUrl}/functions/v1` : null;

  const extractEmail = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    // If raw contains angle-bracket address use that
    const angle = raw.match(/<([^>]+)>/);
    if (angle) return angle[1];
    // Otherwise, try to find an email anywhere in the string
    const simple = raw.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
    return simple ? simple[1] : null;
  };

  const createDraft = async (item) => {
    if (!functionsBase) {
      Alert.alert("Funktionen ikke konfigureret", "Supabase functions base URL mangler.");
      return;
    }

    setCreatingDraftId(item.id);
    try {
      const token = await getToken();
      if (!token) throw new Error("Kunne ikke hente session token.");

  const to = extractEmail(item.rawFrom ?? item.sender);
      if (!to) throw new Error("Kunne ikke udtrække e-mailadresse fra afsender.");

      const body = `Hej ${item.sender.split(" <")[0]},\n\nTak for din besked — her er et udkast til svar.\n\nMvh`;

      const resp = await fetch(`${functionsBase}/gmail-create-draft-ai`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Provide messageId so the server can fetch the full message and build context (shopify orders, etc.)
        body: JSON.stringify({ messageId: item.id, to, subject: `Re: ${item.subject ?? ""}`, body }),
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = payload?.error || `Server svarede ${resp.status}`;
        throw new Error(message);
      }

  Alert.alert("AI-udkast oprettet", "Et AI-genereret udkast er blevet oprettet i din Gmail-indbakke.");
    } catch (err) {
      Alert.alert("Kunne ikke oprette udkast", err?.message ?? String(err));
    } finally {
      setCreatingDraftId(null);
    }
  };

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
        {activeMailProvider === "gmail" ? (
          <View style={{ marginTop: 8 }}>
            <TouchableOpacity
              style={{
                alignSelf: "flex-start",
                backgroundColor: COLORS.primary,
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 8,
              }}
              activeOpacity={0.9}
              onPress={() => createDraft(item)}
              disabled={creatingDraftId === item.id}
            >
              {creatingDraftId === item.id ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Text style={{ color: COLORS.background, fontWeight: "600" }}>Opret udkast</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
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
                  {`Vi forbinder til ${activeProviderLabel ?? "din mailkonto"} og indlæser dine seneste beskeder.`}
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
                  Log ind for at se indbakken
                </Text>
                <Text style={GlobalStyles.inboxEmptySubtitle}>
                  Brug Clerk til at forbinde din Google- eller Microsoft-konto.
                </Text>
              </>
            )}
          </View>
        }
      />
    </LinearGradient>
  );
}
