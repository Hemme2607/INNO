import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useEffect, useState, useCallback } from "react";
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

  const fetchInbox = useCallback(
    async ({ showLoader = true } = {}) => {
      if (!sessionId) {
        setInboxItems([]);
        setLoading(false);
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setErrorMessage(null);

      try {
        // Token template "gmail" must be configured in Clerk to expose the Google OAuth access token.
        const accessToken = await getToken({ template: "gmail" });

        if (!accessToken) {
          throw new Error(
            "Der blev ikke returneret en Gmail-adgangstoken. Tjek at du har logget ind med Google og at Clerk-token templaten 'gmail' giver adgang til Gmail scopes."
          );
        }

        const baseUrl = "https://gmail.googleapis.com/gmail/v1/users/me";
        const listResponse = await fetch(
          `${baseUrl}/messages?maxResults=20&labelIds=INBOX`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (!listResponse.ok) {
          const errorBody = await listResponse.json().catch(() => ({}));
          const reason =
            errorBody.error?.message || `HTTP ${listResponse.status}`;
          throw new Error(`Kunne ikke hente listen af mails: ${reason}`);
        }

        const listPayload = await listResponse.json();
        const messageIds = listPayload.messages ?? [];

        if (messageIds.length === 0) {
          setInboxItems([]);
          return;
        }

        const detailedMessages = await Promise.all(
          messageIds.map(async ({ id }) => {
            const detailResponse = await fetch(
              `${baseUrl}/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            );

            if (!detailResponse.ok) {
              const reason = `HTTP ${detailResponse.status}`;
              throw new Error(`Kunne ikke hente maildetaljer: ${reason}`);
            }

            const detail = await detailResponse.json();
            const headers = detail.payload?.headers ?? [];

            const findHeader = (name) =>
              headers.find(
                (header) => header.name?.toLowerCase() === name.toLowerCase()
              )?.value;

            const subject = findHeader("Subject") || "(ingen emne)";
            const from = findHeader("From") || "Ukendt afsender";
            const dateHeader = findHeader("Date");

            let timeLabel = "";
            if (dateHeader) {
              const parsedDate = new Date(dateHeader);
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
              id: detail.id,
              sender: from.replace(/<.*?>/g, "").trim(),
              subject,
              preview: detail.snippet || "",
              time: timeLabel,
            };
          })
        );

        setInboxItems(detailedMessages);
      } catch (error) {
        setInboxItems([]);
        setErrorMessage(error.message);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
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
      await fetchInbox({ showLoader: false });
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
