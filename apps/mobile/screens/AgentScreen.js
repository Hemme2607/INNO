// Hovedskærm for agenten der samler hero, persona, viden og automation.
import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Alert } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../styles/GlobalStyles";
import AgentOverviewScreen from "./AgentOverviewScreen";
import AgentPersonaDetailsScreen from "./AgentPersonaDetailsScreen";
import AgentKnowledgeTemplatesScreen from "./AgentKnowledgeTemplatesScreen";
import AgentKnowledgeDocumentsScreen from "./AgentKnowledgeDocumentsScreen";
import AgentKnowledgeTemplateEditorScreen from "./AgentKnowledgeTemplateEditorScreen";
import { useDisplayName } from "../lib/hooks/useDisplayName";
import { useShopDomain } from "../lib/hooks/useShopDomain";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useAgentPersonaConfig } from "../lib/hooks/useAgentPersonaConfig";
import { useAgentTemplates } from "../lib/hooks/useAgentTemplates";
import { useAgentAutomation } from "../lib/hooks/useAgentAutomation";
import { useClerkSupabase } from "../lib/supabaseClient";
const AgentStack = createNativeStackNavigator();

// Mailudbydere vi kan slå op i via edge functions
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

export default function AgentScreen() {
  // Samler hooks og navigation til agentens forskellige skærme
  const displayName = useDisplayName();
  const { shopDomain } = useShopDomain();
  const { getToken, sessionId } = useAuth();
  const { user } = useUser();
  const supabase = useClerkSupabase();
  // Supabase-id kan ligge i Clerk metadata
  const metadataSupabaseId =
    typeof user?.publicMetadata?.supabase_uuid === "string" &&
    user.publicMetadata.supabase_uuid.length
      ? user.publicMetadata.supabase_uuid
      : null;
  // State til at gemme supabase user id
  const [supabaseUserId, setSupabaseUserId] = useState(metadataSupabaseId);
  // Loader når vi slår supabase id op
  const [isResolvingSupabaseId, setIsResolvingSupabaseId] = useState(false);
  // Ref til at undgå dobbeltopslag
  const supabaseIdLookupAttempted = useRef(false);

  // Hydrer persona-formen fra Supabase første gang (men lad manuelle ændringer stå)
  useEffect(() => {
    // Opdater lokal state ved metadata-ændring
    setSupabaseUserId(metadataSupabaseId);
    if (metadataSupabaseId) {
      // Markér at vi allerede har forsøgt
      supabaseIdLookupAttempted.current = true;
    }
  }, [metadataSupabaseId]);

  useEffect(() => {
    // Nulstil lookup når bruger skifter
    supabaseIdLookupAttempted.current = false;
  }, [user?.id]);

  useEffect(() => {
    // Lokal flag til at stoppe state updates efter unmount
    let cancelled = false;
    if (
      supabaseUserId ||
      !user?.id ||
      isResolvingSupabaseId ||
      supabaseIdLookupAttempted.current
    ) {
      return () => {
        cancelled = true;
      };
    }

    // Start lookup af supabase id
    setIsResolvingSupabaseId(true);
    supabaseIdLookupAttempted.current = true;

    supabase
      .from("profiles")
      .select("user_id")
      .eq("clerk_user_id", user.id)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn("Kunne ikke slå supabase_user_id op:", error);
          setSupabaseUserId(null);
          return;
        }
        const fetchedId =
          typeof data?.user_id === "string" && data.user_id.length ? data.user_id : null;
        if (!fetchedId) {
          setSupabaseUserId(null);
          return;
        }
        // Gem id i state
        setSupabaseUserId(fetchedId);
        if (!metadataSupabaseId && user) {
          try {
            // Cache id i Clerk metadata for næste gang
            await user.update({
              publicMetadata: {
                ...(user.publicMetadata ?? {}),
                supabase_uuid: fetchedId,
              },
            });
          } catch (updateError) {
            console.warn("Kunne ikke opdatere Clerk metadata med supabase_uuid:", updateError);
          }
        }
      })
      .finally(() => {
        if (!cancelled) {
          // Stop loader når kaldet er færdigt
          setIsResolvingSupabaseId(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [metadataSupabaseId, supabase, supabaseUserId, user, isResolvingSupabaseId]);

  // Hent persona-konfiguration
  const {
    persona,
    loading: personaLoading,
    save: savePersona,
    saving: personaSaving,
    error: personaError,
  } = useAgentPersonaConfig({ userId: supabaseUserId, lazy: false });
  // Hent templates
  const {
    templates,
    loading: templatesLoading,
    processing: templatesProcessing,
    createTemplate,
  } = useAgentTemplates({ userId: supabaseUserId, lazy: !supabaseUserId });
  // Hent automation-indstillinger
  const {
    settings: automationSettings,
    loading: automationLoading,
    saving: automationSaving,
    save: saveAutomation,
    defaults: automationDefaults,
    error: automationError,
  } = useAgentAutomation({ userId: supabaseUserId, lazy: !supabaseUserId });

  // Lokal state til persona-felter
  const [personaConfig, setPersonaConfig] = useState({
    signature: "",
    scenario: "",
    instructions: "",
  });
  // Flags for init og ændringer
  const [hasHydratedPersona, setHasHydratedPersona] = useState(false);
  const [isPersonaModified, setIsPersonaModified] = useState(false);
  // Lokal state til templatesøgning
  const [templateSearchResults, setTemplateSearchResults] = useState([]);
  const [templateSearchError, setTemplateSearchError] = useState(null);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);
  // Lokal state for valgt mail og tekstfelter
  const [selectedTemplateMailId, setSelectedTemplateMailId] = useState(null);
  const [templateBody, setTemplateBody] = useState("");
  const [templateSourceBody, setTemplateSourceBody] = useState("");
  const [templateSourceError, setTemplateSourceError] = useState(null);
  const [isFetchingTemplateSource, setIsFetchingTemplateSource] = useState(false);
  // State til persona-test
  const [personaTestResult, setPersonaTestResult] = useState("");
  const [personaTestError, setPersonaTestError] = useState(null);
  const [isTestingPersonaResponse, setIsTestingPersonaResponse] = useState(false);

  // Standard signatur baseret på bruger og shop
  const defaultSignature = useMemo(() => {
    const trimmedName = displayName?.trim();
    const trimmedShop = shopDomain?.trim();

    const nameLine = trimmedName && trimmedName.length ? trimmedName : "Din agent";
    const shopLine = trimmedShop && trimmedShop.length ? `\n${trimmedShop}` : "";

    return `Venlig hilsen\n${nameLine}${shopLine}`;
  }, [displayName, shopDomain]);

  useEffect(() => {
    // Hydrer formularen når persona findes og ingen lokale ændringer
    if (persona && !isPersonaModified) {
      setPersonaConfig({
        signature: persona.signature ?? "",
        scenario: persona.scenario ?? "",
        instructions: persona.instructions ?? "",
      });
      setHasHydratedPersona(true);
      return;
    }

    // Hvis der ikke er persona endnu, brug default signatur
    if (!persona && !hasHydratedPersona) {
      setPersonaConfig({
        signature: defaultSignature,
        scenario: "",
        instructions: "",
      });
      setHasHydratedPersona(true);
    }
  }, [persona, defaultSignature, hasHydratedPersona, isPersonaModified]);

  useEffect(() => {
    // Nulstil flags når supabase bruger skifter
    setHasHydratedPersona(false);
    setIsPersonaModified(false);
  }, [supabaseUserId]);

  // Sorterer mailudbydere så allerede forbundne vises først
  const prioritizedProviders = useMemo(() => {
    // Udtræk provider-keys fra Clerk
    const connected = new Set(
      (user?.externalAccounts ?? [])
        .map((account) => account?.provider)
        .filter((provider) => typeof provider === "string")
    );

    // Tilsluttede udbydere
    const connectedMail = MAIL_PROVIDERS.filter((provider) =>
      connected.has(provider.providerKey)
    );
    // Fallback-udbydere
    const fallbackMail = MAIL_PROVIDERS.filter(
      (provider) => !connected.has(provider.providerKey)
    );

    // Returner sammensat liste
    return [...connectedMail, ...fallbackMail];
  }, [user]);

  const personaErrorMessage = useMemo(() => {
    // Normaliser fejl til tekst
    if (!personaError) {
      return null;
    }
    if (typeof personaError === "string") {
      return personaError;
    }
    if (personaError instanceof Error) {
      return personaError.message;
    }
    return String(personaError);
  }, [personaError]);

  // Lokal state for formularfelterne – gem først når brugeren klikker
  const handlePersonaConfigUpdate = useCallback(
    (updates) => {
      // Merge felter i state
      setPersonaConfig((prev) => {
        const next = { ...prev, ...updates };
        return next;
      });
      // Markér at der er ændringer
      setIsPersonaModified(true);
    },
    []
  );

  // Sender persona-data til backend og nulstiller modified-flag på succes
  const handlePersonaSave = useCallback(() => {
    // Gem via hook
    savePersona(personaConfig)
      .then(() => {
        // Ryd modified-flag når gemt
        setIsPersonaModified(false);
      })
      .catch(() => null);
  }, [personaConfig, savePersona]);

  // Genererer et AI-testsvar via edge funktionen
  const handlePersonaTest = useCallback(async () => {
    // Læs Supabase URL fra env
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
    if (!supabaseUrl) {
      setPersonaTestError("Supabase URL mangler i miljøvariablerne.");
      return;
    }

    // Nulstil gamle resultater
    setPersonaTestError(null);
    setPersonaTestResult("");
    setIsTestingPersonaResponse(true);

    try {
      // Token til edge function
      const token = await getToken();
      if (!token) {
        throw new Error("Kunne ikke hente session token.");
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/persona-test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          signature: personaConfig.signature || defaultSignature,
          scenario: personaConfig.scenario,
          instructions: personaConfig.instructions,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : `Persona test fejlede (${response.status}).`;
        throw new Error(message);
      }

      // Vis svar fra testen
      const reply =
        typeof payload?.reply === "string" && payload.reply.trim().length
          ? payload.reply.trim()
          : "Testen returnerede intet svar.";
      setPersonaTestResult(reply);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl ved testen.";
      setPersonaTestError(message);
    } finally {
      // Stop loader
      setIsTestingPersonaResponse(false);
    }
  }, [personaConfig, defaultSignature, getToken]);

  // Søg efter mails i forbundne mailudbydere og map resultatet til templates
  const handleTemplateSearch = useCallback(
    async (query) => {
      // Trim query og stop hvis tom
      const trimmedQuery = query.trim();
      if (!sessionId || !trimmedQuery) {
        setTemplateSearchResults([]);
        setTemplateSearchError(null);
        return;
      }

      // Læs Supabase konfiguration
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        setTemplateSearchError("Supabase konfiguration mangler.");
        return;
      }

      // Start loader og ryd fejl
      setIsSearchingTemplates(true);
      setTemplateSearchError(null);

      try {
        // Token til edge functions
        const token = await getToken();
        if (!token) {
          throw new Error("Kunne ikke hente session token.");
        }

        const baseUrl = supabaseUrl.replace(/\/$/, "");
        let aggregatedResults = [];

        for (const provider of prioritizedProviders) {
          const endpoint = `${baseUrl}/functions/v1/${provider.functionName}?q=${encodeURIComponent(
            trimmedQuery
          )}&maxResults=10`;
          try {
            const response = await fetch(endpoint, {
              headers: {
                Authorization: `Bearer ${token}`,
                apikey: supabaseAnonKey,
              },
            });

            if (!response.ok) {
              const errorBody = await response.text();
              const message = errorBody?.trim() || `HTTP ${response.status}`;
              if ([401, 403, 404].includes(response.status)) {
                // Udbyder ikke tilsluttet, spring videre
                continue;
              }
              throw new Error(message);
            }

            const payload = await response.json();
            const rawItems = Array.isArray(payload?.items)
              ? payload.items
              : Array.isArray(payload?.messages)
              ? payload.messages
              : [];

            if (!rawItems.length) {
              continue;
            }

            // Map til lokalt template-format
            const mapped = rawItems.map((message) => {
              const rawSender =
                typeof message?.sender === "string"
                  ? message.sender
                  : typeof message?.from === "string"
                  ? message.from
                  : "";
              const cleanSender = rawSender.replace(/<.*?>/g, "").trim();

              return {
                id: message?.id ?? Math.random().toString(36),
                providerId: provider.id,
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
              };
            });

            // Brug første udbyder der giver resultater
            aggregatedResults = mapped;
            break;
          } catch (error) {
            console.warn("Mail search failed for", provider.id, error);
            continue;
          }
        }

        // Opdater search state
        setTemplateSearchResults(aggregatedResults);
        if (!aggregatedResults.length) {
          setSelectedTemplateMailId(null);
          setTemplateSourceBody("");
          setTemplateSourceError(null);
        }
      } catch (error) {
        setTemplateSearchError(
          error instanceof Error ? error.message : "Kunne ikke søge i indbakken."
        );
      } finally {
        // Stop loader
        setIsSearchingTemplates(false);
      }
    },
    [getToken, prioritizedProviders, sessionId]
  );

  // Henter mailindhold for et specifikt provider-id
  const fetchMailBody = useCallback(
    async (providerId, mailId) => {
      // Læs Supabase konfiguration
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase konfiguration mangler.");
      }

      // Find udbyder i listen
      const provider = MAIL_PROVIDERS.find((item) => item.id === providerId);
      if (!provider) {
        throw new Error("Mailudbyder ikke understøttet.");
      }

      // Token til edge function
      const token = await getToken();
      if (!token) {
        throw new Error("Kunne ikke hente session token.");
      }

      // Byg endpoint med messageId
      const baseUrl = supabaseUrl.replace(/\/$/, "");
      const endpoint = `${baseUrl}/functions/v1/${provider.functionName}?messageId=${encodeURIComponent(mailId)}`;
      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          apikey: supabaseAnonKey,
        },
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Kunne ikke hente mailindhold (${response.status})`);
      }

      const payload = await response.json();
      const item = payload?.item ?? null;
      return typeof item?.body === "string" ? item.body : "";
    },
    [getToken]
  );

  // Markerer valgt mail i state og forsøger at hente dens tekst
  const handleSelectTemplateMail = useCallback(
    async (mailId) => {
      // Ryd fejl ved nyt valg
      setTemplateSourceError(null);

      if (!mailId) {
        setSelectedTemplateMailId(null);
        setTemplateSourceBody("");
        return;
      }

      if (selectedTemplateMailId === mailId) {
        // Klik igen fjerner valget
        setSelectedTemplateMailId(null);
        setTemplateSourceBody("");
        return;
      }

      const mail = templateSearchResults.find((item) => item.id === mailId);
      setSelectedTemplateMailId(mailId);

      if (!mail) {
        setTemplateSourceBody("");
        return;
      }

      // Vælg provider, ellers fallback
      const providerId = mail.providerId ?? prioritizedProviders[0]?.id ?? "";
      if (!providerId) {
        setTemplateSourceBody(mail.preview || "");
        return;
      }

      try {
        // Hent fuldt mailindhold
        setIsFetchingTemplateSource(true);
        const body = await fetchMailBody(providerId, mailId);
        setTemplateSourceBody(body || mail.preview || "");
      } catch (error) {
        setTemplateSourceError(
          error instanceof Error ? error.message : "Kunne ikke hente mailindhold."
        );
        setTemplateSourceBody(mail.preview || "");
      } finally {
        // Stop loader
        setIsFetchingTemplateSource(false);
      }
    },
    [fetchMailBody, prioritizedProviders, selectedTemplateMailId, templateSearchResults]
  );

  // Opdaterer svar-tekstfeltet mens brugeren skriver
  const handleChangeTemplateBody = useCallback((value) => {
    // Gem nyt template body
    setTemplateBody(value);
  }, []);

  // Overskriver kilde-tekst og rydder evt. valgt mail, hvis brugeren skriver selv
  const handleChangeTemplateSourceBody = useCallback((value) => {
    // Opdater source body
    setTemplateSourceBody(value);
    // Fravælg mail hvis brugeren redigerer selv
    setSelectedTemplateMailId(null);
    setTemplateSourceError(null);
  }, []);

  // Gemmer et nyt standardsvar i Supabase og rydder formularen
  const handleSaveTemplate = useCallback(
    async ({ templateBody: body, selectedMailId: mailId, sourceBody }) => {
      if (!body.trim()) {
        return false;
      }

      // Find mail for at få provider-id
      const mail = templateSearchResults.find((item) => item.id === mailId);
      const providerId = mail?.providerId ?? null;

      try {
        // Gem template via hook
        await createTemplate({
          title: body.split("\n")[0]?.slice(0, 64) || "Nyt standardsvar",
          body,
          sourceBody,
          linkedMailId: mailId ?? null,
          linkedMailProvider: providerId,
        });
        // Ryd formular og søgning efter gem
        setTemplateBody("");
        setSelectedTemplateMailId(null);
        setTemplateSourceBody("");
        setTemplateSourceError(null);
        setTemplateSearchResults([]);
        return true;
      } catch (error) {
        setTemplateSourceError(
          error instanceof Error ? error.message : "Kunne ikke gemme standardsvar."
        );
        return false;
      }
    },
    [createTemplate, templateSearchResults]
  );

  // Placeholder til kladde-funktionalitet der gemmes senere
  const handleSaveTemplateDraft = useCallback(() => {
    // Placeholder til senere implementering
  }, []);

  // Viser venligt alert fordi dokumentupload ikke er klar endnu
  const handleUploadDocument = useCallback(() => {
    Alert.alert(
      "Kommer snart",
      "Dokumentbiblioteket er under udvikling. Upload af filer bliver tilgængeligt snart."
    );
  }, []);

  // Gemmer automation-flags enkeltvis når brugeren toggler et felt
  const handleAutomationToggle = useCallback(
    (key, value) => {
      // Gem kun det felt der blev ændret
      saveAutomation({ [key]: value }).catch(() => null);
    },
    [saveAutomation]
  );

  // Bruges af hero-knappen til at aktivere/deaktivere den bagvedliggende cron
  const handleToggleAutoDraft = useCallback(
    async (nextValue) => {
      if (automationSaving) return;
      try {
        // Gem autoDraftEnabled flaget
        await saveAutomation({ autoDraftEnabled: nextValue });
        Alert.alert(
          nextValue ? "Agent aktiveret" : "Agent deaktiveret",
          nextValue
            ? "Din agent begynder nu automatisk at klargøre udkast."
            : "Agenten stopper med automatisk at oprette drafts."
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : typeof err?.message === "string"
            ? err.message
            : "Kunne ikke opdatere agentstatus. Prøv igen senere.";
        Alert.alert("Fejl", message);
      }
    },
    [automationSaving, saveAutomation]
  );

  return (
    <AgentStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surfaceAlt,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      {/* Overbliksskærmen */}
      <AgentStack.Screen
        name="AgentOverview"
        options={{ headerShown: false }}
      >
        {(props) => (
          <AgentOverviewScreen
            {...props}
            onOpenPersona={() => props.navigation.navigate("AgentPersonaDetails")}
            onOpenTemplates={() => props.navigation.navigate("AgentKnowledgeTemplates")}
            onOpenDocuments={() => props.navigation.navigate("AgentKnowledgeDocuments")}
            personaConfig={personaConfig}
            defaultSignature={defaultSignature}
            displayName={displayName}
            shopDomain={shopDomain}
            automationSettings={automationSettings}
            automationLoading={automationLoading}
            automationSaving={automationSaving}
            automationError={
              typeof automationError === "string"
                ? automationError
                : automationError?.message ?? null
            }
            automationDefaults={automationDefaults}
            onAutomationToggle={handleAutomationToggle}
            onToggleAutoDraft={handleToggleAutoDraft}
          />
        )}
      </AgentStack.Screen>
      {/* Skærm til persona */}
      <AgentStack.Screen
        name="AgentPersonaDetails"
        options={{ title: "Tilpas agent" }}
      >
        {(props) => (
          <AgentPersonaDetailsScreen
            {...props}
            personaConfig={personaConfig}
            onUpdatePersonaConfig={handlePersonaConfigUpdate}
            defaultSignature={defaultSignature}
            onSavePersona={handlePersonaSave}
            savingPersona={personaSaving}
            personaError={personaErrorMessage}
            onTestPersona={handlePersonaTest}
            testResult={personaTestResult}
            testError={personaTestError}
            isTestingPersona={isTestingPersonaResponse}
          />
        )}
      </AgentStack.Screen>
      {/* Skærm til standardsvar */}
      <AgentStack.Screen
        name="AgentKnowledgeTemplates"
        options={{ title: "Standardsvar" }}
      >
        {(props) => (
          <AgentKnowledgeTemplatesScreen
            {...props}
            templates={templates}
            loading={templatesLoading}
            processing={templatesProcessing}
          />
        )}
      </AgentStack.Screen>
      {/* Skærm til dokumenter */}
      <AgentStack.Screen
        name="AgentKnowledgeDocuments"
        options={{ title: "Dokumentbibliotek" }}
      >
        {(props) => (
          <AgentKnowledgeDocumentsScreen
            {...props}
            warningMessage="Dokumentbiblioteket er under udvikling og bliver tilgængeligt snart."
            onUploadDocument={handleUploadDocument}
          />
        )}
      </AgentStack.Screen>
      {/* Editor til standardsvar */}
      <AgentStack.Screen
        name="AgentKnowledgeTemplateEditor"
        options={{ title: "Redigér standardsvar" }}
      >
        {(props) => (
          <AgentKnowledgeTemplateEditorScreen
            {...props}
            searchResults={templateSearchResults}
            searching={isSearchingTemplates}
            searchError={templateSearchError}
            onSearch={handleTemplateSearch}
            selectedMailId={selectedTemplateMailId}
            onSelectMail={handleSelectTemplateMail}
            templateBody={templateBody}
            onChangeTemplateBody={handleChangeTemplateBody}
            onSaveTemplate={handleSaveTemplate}
            onSaveDraft={handleSaveTemplateDraft}
            sourceBody={templateSourceBody}
            onChangeSourceBody={handleChangeTemplateSourceBody}
            sourceLoading={isFetchingTemplateSource}
            sourceError={templateSourceError}
            savingTemplate={templatesProcessing}
          />
        )}
      </AgentStack.Screen>
    </AgentStack.Navigator>
  );
}
