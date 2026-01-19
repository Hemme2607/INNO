// Skærm der viser indbakken og AI-udkast.
import { View, Text, FlatList, ActivityIndicator, RefreshControl, TouchableOpacity, Alert } from "react-native";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

// Mailudbydere vi kan hente mails fra (rækkefølgen kan ændres).
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
  // Login og session.
  const { getToken, sessionId } = useAuth();
  const { user } = useUser();
  // Status for knappen "Opret udkast".
  const [creatingDraftId, setCreatingDraftId] = useState(null);
  // Data til indbakken og loading.
  const [inboxItems, setInboxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  // Hvilken udbyder der gav os data.
  const [activeMailProvider, setActiveMailProvider] = useState(null);
  // Gemmer tid og lås for at undgå for mange kald.
  const lastFetchRef = useRef(0);
  const isFetchingRef = useRef(false);

  const MIN_FETCH_INTERVAL = 60 * 1000; // så vi ikke spørger for tit

  // Tilsluttede konti prøves først.
  const prioritizedProviders = useMemo(() => {
    // Saml alle forbundne provider-keys fra Clerk
    const connected = new Set(
      (user?.externalAccounts ?? [])
        .map((account) => account?.provider)
        .filter((provider) => typeof provider === "string")
    );

    // Udbydere der allerede er tilsluttet
    const connectedMail = MAIL_PROVIDERS.filter((provider) =>
      connected.has(provider.providerKey)
    );
    // Resten kommer bagefter som fallback
    const fallbackMail = MAIL_PROVIDERS.filter(
      (provider) => !connected.has(provider.providerKey)
    );

    // Returner liste med tilsluttede først
    return [...connectedMail, ...fallbackMail];
  }, [user]);

  // Tekst til tom tilstand.
  const activeProviderLabel = useMemo(() => {
    // Find label for aktiv udbyder
    const provider = MAIL_PROVIDERS.find((item) => item.id === activeMailProvider);
    return provider?.label ?? null;
  }, [activeMailProvider]);

  // Hent indbakke med enkel rate limiting.
  const fetchInbox = useCallback(
    async ({ showLoader = true, force = false } = {}) => {
      // Ingen session = ingen mails.
      if (!sessionId) {
        setInboxItems([]);
        setActiveMailProvider(null);
        setLoading(false);
        return;
      }

      // Undgå flere kald på samme tid.
      if (isFetchingRef.current) {
        return;
      }

      // Rate limit baseret på sidste kald
      const now = Date.now();
      if (!force && now - lastFetchRef.current < MIN_FETCH_INTERVAL) {
        // Har allerede hentet indenfor intervallet → spring over
        if (showLoader) {
          setLoading(false);
        }
        return;
      }

      if (showLoader) {
        // Vis loader mens vi henter
        setLoading(true);
      }

      // Ryd fejl før nyt kald.
      setErrorMessage(null);
      isFetchingRef.current = true;

      try {
        // Supabase config fra appens env.
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

        // Hent token til edge functions.
        const sessionToken = await getToken();
        if (!sessionToken) {
          throw new Error(
            "Kunne ikke hente Clerk session token. Log ind igen og prøv senere."
          );
        }

        // Normaliser base URL til edge functions
        const baseUrl = supabaseUrl.replace(/\/$/, "");
        let fetched = false;
        let lastError = null;

        // Prøv alle udbydere i rækkefølge.
        for (const provider of prioritizedProviders) {
          const endpoint = `${baseUrl}/functions/v1/${provider.functionName}`;
          try {
            // Edge function der henter mails.
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
                // Ofte betyder det, at udbyderen ikke er koblet til.
                lastError = error;
                continue;
              }
              throw error;
            }

            const payload = await response.json();
            // Backenden kan bruge items eller messages.
            const rawItems = Array.isArray(payload?.items)
              ? payload.items
              : Array.isArray(payload?.messages)
              ? payload.messages
              : [];

            // Kort map til UI-format
            const mapped = rawItems.map((message) => {
              // "from" eller "sender" afhængigt af backend.
              const rawSender =
                typeof message?.sender === "string"
                  ? message.sender
                  : typeof message?.from === "string"
                  ? message.from
                  : "";

              // Fjern <mail@domæne> så vi kun viser navn.
              const cleanSender = rawSender.replace(/<.*?>/g, "").trim();

              let timeLabel = "";
              const dateSource =
                message?.date ??
                message?.internalDate ??
                message?.receivedAt ??
                null;
              // Gmail/Outlook kan give unix-tid eller tekst → parse det.
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
                // Gem rå header så vi kan finde e-mail senere.
                rawFrom:
                  typeof message?.from === "string"
                    ? message.from
                    : typeof message?.sender === "string"
                    ? message.sender
                    : "",
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

            // Opdater state og stop ved første succes.
            setInboxItems(mapped);
            setActiveMailProvider(provider.id);
            fetched = true;
            break;
          } catch (providerError) {
            // Gem sidste fejl og prøv næste udbyder
            lastError =
              providerError instanceof Error
                ? providerError
                : new Error(String(providerError));
          }
        }

        if (!fetched) {
          // Ingen udbydere gav data → vis fejl.
          setActiveMailProvider(null);
          if (lastError) {
            throw lastError;
          }
          throw new Error("Kunne ikke hente mails fra nogen mailudbyder.");
        }
      } catch (error) {
        // Fejl → nulstil data og vis besked.
        setInboxItems([]);
        setActiveMailProvider(null);
        setErrorMessage(error.message);
      } finally {
        // Ryd lås og opdater tid.
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
    // Hent indbakke ved start.
    fetchInbox();
  }, [fetchInbox]);

  // Base URL til edge functions.
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const functionsBase = supabaseUrl ? `${supabaseUrl}/functions/v1` : null;

  // Finder e-mailadresse i mail-headeren.
  const extractEmail = (raw) => {
    if (!raw || typeof raw !== "string") return null;
    // Hvis der er <mail@domæne>, brug den.
    const angle = raw.match(/<([^>]+)>/);
    if (angle) return angle[1];
    // Ellers find en mail i teksten.
    const simple = raw.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);
    return simple ? simple[1] : null;
  };

  // Kalder edge function for at lave et AI-udkast.
  const createDraft = async (item) => {
    // Mangler base URL, kan vi ikke kalde serveren.
    if (!functionsBase) {
      Alert.alert("Funktionen ikke konfigureret", "Supabase functions base URL mangler.");
      return;
    }

    // Markerer hvilke mail der er i gang
    setCreatingDraftId(item.id);
    try {
      // Token til server-kald.
      const token = await getToken();
      if (!token) throw new Error("Kunne ikke hente session token.");

      // Find modtager-mail i header.
      const to = extractEmail(item.rawFrom ?? item.sender);
      if (!to) throw new Error("Kunne ikke udtrække e-mailadresse fra afsender.");

      // Simpelt udkast (serveren kan gøre det bedre).
      const body = `Hej ${item.sender.split(" <")[0]},\n\nTak for din besked — her er et udkast til svar.\n\nMvh`;

      const resp = await fetch(`${functionsBase}/gmail-create-draft-ai`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // Send messageId så serveren kan hente fuld mail og mere kontekst.
        body: JSON.stringify({ messageId: item.id, to, subject: `Re: ${item.subject ?? ""}`, body }),
      });

      const payload = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        const message = payload?.error || `Server svarede ${resp.status}`;
        throw new Error(message);
      }

      // Besked ved succes.
      Alert.alert(
        "AI-udkast oprettet",
        "Et AI-genereret udkast er blevet oprettet i din Gmail-indbakke."
      );
    } catch (err) {
      // Besked ved fejl.
      Alert.alert("Kunne ikke oprette udkast", err?.message ?? String(err));
    } finally {
      // Ryd loading-indikator
      setCreatingDraftId(null);
    }
  };

  const onRefresh = useCallback(async () => {
    // Pull-to-refresh: tving et nyt kald.
    setRefreshing(true);
    try {
      await fetchInbox({ showLoader: false, force: true });
    } finally {
      setRefreshing(false);
    }
  }, [fetchInbox]);

  // Render for hver mail.
  const renderItem = ({ item }) => (
    <View style={GlobalStyles.inboxRow}>
      {/* Avatar-venlig initial */}
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
              {/* Spinner mens udkast laves */}
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

  // Selve skærmen.
  return (
    <LinearGradient
      // Baggrundsgradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      // Retning for gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      // Container-stil
      style={GlobalStyles.inboxScreen}
    >
      {/* Lille streg øverst */}
      <View style={GlobalStyles.inboxTopDivider} />
      <View style={GlobalStyles.inboxHeader}>
        <View>
          <Text style={GlobalStyles.inboxHeading}>Indbakke</Text>
          <Text style={GlobalStyles.inboxSubtitle}>
            Se nye mails og AI-klargjorte svar her.
          </Text>
        </View>
        {/* Placeholder for søge-knap */}
        <View style={GlobalStyles.inboxHeaderButton}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.text}
          />
        </View>
      </View>

      {/* Indbakke-listen */}
      <FlatList
        // Data til listen
        data={inboxItems}
        // Sikker key til hver række
        keyExtractor={(item, index) => item.id ?? String(index)}
        // Render-metode for hver mail
        renderItem={renderItem}
        // Padding og tom-state styling
        contentContainerStyle={[
          GlobalStyles.inboxListContent,
          inboxItems.length === 0 && GlobalStyles.inboxListEmptyContent,
        ]}
        // Pull-to-refresh styring
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }
        // Separator mellem mails
        ItemSeparatorComponent={() => <View style={GlobalStyles.inboxSeparator} />}
        // Tom tilstand: loading, fejl, tom liste eller ikke logget ind
        ListEmptyComponent={
          <View style={GlobalStyles.inboxEmptyState}>
            {/* Skifter mellem loading, fejl, tom indbakke og login */}
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
