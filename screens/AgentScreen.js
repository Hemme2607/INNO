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
import { useAgentDocuments } from "../lib/hooks/useAgentDocuments";
import { useAgentAutomation } from "../lib/hooks/useAgentAutomation";
import { useClerkSupabase } from "../lib/supabaseClient";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { decode as base64Decode } from "base-64";

const AgentStack = createNativeStackNavigator();

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
  const displayName = useDisplayName();
  const { shopDomain } = useShopDomain();
  const { getToken, sessionId } = useAuth();
  const { user } = useUser();
  const supabase = useClerkSupabase();

  const {
    persona,
    loading: personaLoading,
    save: savePersona,
  } = useAgentPersonaConfig({ userId: user?.id ?? null, lazy: !user });
  const {
    templates,
    loading: templatesLoading,
    processing: templatesProcessing,
    createTemplate,
  } = useAgentTemplates({ userId: user?.id ?? null, lazy: !user });
  const {
    documents,
    loading: documentsLoading,
    processing: documentsProcessing,
    createDocumentRecord,
  } = useAgentDocuments({ userId: user?.id ?? null, lazy: !user });
  const {
    settings: automationSettings,
    loading: automationLoading,
    saving: automationSaving,
    save: saveAutomation,
    defaults: automationDefaults,
    error: automationError,
  } = useAgentAutomation({ userId: user?.id ?? null, lazy: !user });

  const [personaConfig, setPersonaConfig] = useState({
    signature: "",
    scenario: "",
    instructions: "",
  });
  const [templateSearchResults, setTemplateSearchResults] = useState([]);
  const [templateSearchError, setTemplateSearchError] = useState(null);
  const [isSearchingTemplates, setIsSearchingTemplates] = useState(false);
  const [selectedTemplateMailId, setSelectedTemplateMailId] = useState(null);
  const [templateBody, setTemplateBody] = useState("");
  const [templateSourceBody, setTemplateSourceBody] = useState("");
  const [templateSourceError, setTemplateSourceError] = useState(null);
  const [isFetchingTemplateSource, setIsFetchingTemplateSource] = useState(false);
  const personaSaveTimeout = useRef(null);

  const defaultSignature = useMemo(() => {
    const trimmedName = displayName?.trim();
    const trimmedShop = shopDomain?.trim();

    const nameLine = trimmedName && trimmedName.length ? trimmedName : "Din agent";
    const shopLine = trimmedShop && trimmedShop.length ? `\n${trimmedShop}` : "";

    return `Venlig hilsen\n${nameLine}${shopLine}`;
  }, [displayName, shopDomain]);

  useEffect(() => {
    if (persona) {
      setPersonaConfig({
        signature: persona.signature ?? "",
        scenario: persona.scenario ?? "",
        instructions: persona.instructions ?? "",
      });
    } else {
      setPersonaConfig({
        signature: defaultSignature,
        scenario: "",
        instructions: "",
      });
    }
  }, [persona, defaultSignature]);

  useEffect(() => () => {
    if (personaSaveTimeout.current) {
      clearTimeout(personaSaveTimeout.current);
    }
  }, []);

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

  const schedulePersonaSave = useCallback(
    (nextState) => {
      if (personaSaveTimeout.current) {
        clearTimeout(personaSaveTimeout.current);
      }
      personaSaveTimeout.current = setTimeout(() => {
        savePersona(nextState).catch(() => null);
      }, 600);
    },
    [savePersona]
  );

  const handlePersonaConfigUpdate = useCallback(
    (updates) => {
      setPersonaConfig((prev) => {
        const next = { ...prev, ...updates };
        schedulePersonaSave(next);
        return next;
      });
    },
    [schedulePersonaSave]
  );

  const handleTemplateSearch = useCallback(
    async (query) => {
      const trimmedQuery = query.trim();
      if (!sessionId || !trimmedQuery) {
        setTemplateSearchResults([]);
        setTemplateSearchError(null);
        return;
      }

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        setTemplateSearchError("Supabase konfiguration mangler.");
        return;
      }

      setIsSearchingTemplates(true);
      setTemplateSearchError(null);

      try {
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

            aggregatedResults = mapped;
            break;
          } catch (error) {
            console.warn("Mail search failed for", provider.id, error);
            continue;
          }
        }

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
        setIsSearchingTemplates(false);
      }
    },
    [getToken, prioritizedProviders, sessionId]
  );

  const fetchMailBody = useCallback(
    async (providerId, mailId) => {
      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase konfiguration mangler.");
      }

      const provider = MAIL_PROVIDERS.find((item) => item.id === providerId);
      if (!provider) {
        throw new Error("Mailudbyder ikke understøttet.");
      }

      const token = await getToken();
      if (!token) {
        throw new Error("Kunne ikke hente session token.");
      }

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

  const handleSelectTemplateMail = useCallback(
    async (mailId) => {
      setTemplateSourceError(null);

      if (!mailId) {
        setSelectedTemplateMailId(null);
        setTemplateSourceBody("");
        return;
      }

      if (selectedTemplateMailId === mailId) {
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

      const providerId = mail.providerId ?? prioritizedProviders[0]?.id ?? "";
      if (!providerId) {
        setTemplateSourceBody(mail.preview || "");
        return;
      }

      try {
        setIsFetchingTemplateSource(true);
        const body = await fetchMailBody(providerId, mailId);
        setTemplateSourceBody(body || mail.preview || "");
      } catch (error) {
        setTemplateSourceError(
          error instanceof Error ? error.message : "Kunne ikke hente mailindhold."
        );
        setTemplateSourceBody(mail.preview || "");
      } finally {
        setIsFetchingTemplateSource(false);
      }
    },
    [fetchMailBody, prioritizedProviders, selectedTemplateMailId, templateSearchResults]
  );

  const handleChangeTemplateBody = useCallback((value) => {
    setTemplateBody(value);
  }, []);

  const handleChangeTemplateSourceBody = useCallback((value) => {
    setTemplateSourceBody(value);
    setSelectedTemplateMailId(null);
    setTemplateSourceError(null);
  }, []);

  const handleSaveTemplate = useCallback(
    async ({ templateBody: body, selectedMailId: mailId, sourceBody }) => {
      if (!body.trim()) {
        return false;
      }

      const mail = templateSearchResults.find((item) => item.id === mailId);
      const providerId = mail?.providerId ?? null;

      try {
        await createTemplate({
          title: body.split("\n")[0]?.slice(0, 64) || "Nyt standardsvar",
          body,
          sourceBody,
          linkedMailId: mailId ?? null,
          linkedMailProvider: providerId,
        });
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

  const handleSaveTemplateDraft = useCallback(() => {
    // Placeholder til senere implementering
  }, []);

  const handleUploadDocument = useCallback(async () => {
    if (documentsProcessing) {
      return;
    }

    try {
      if (!user?.id) {
        Alert.alert("Upload ikke muligt", "Brugeren er ikke klar endnu. Prøv igen om lidt.");
        return;
      }

      const result = await DocumentPicker.getDocumentAsync({
        multiple: false,
        copyToCacheDirectory: true,
        type: "*/*",
      });

      if (result.canceled) {
        return;
      }

      const asset = result.assets?.[0] ?? result;
      if (!asset?.uri) {
        return;
      }

      const fileName = asset.name ?? asset.file?.name ?? `dokument-${Date.now()}`;
      const mimeType = asset.mimeType ?? asset.file?.type ?? "application/octet-stream";
      const fileSize = asset.size ?? null;

      const base64Content = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const binary = base64Decode(base64Content);
      const byteArray = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) {
        byteArray[i] = binary.charCodeAt(i);
      }

      const fileBody =
        typeof Blob !== "undefined"
          ? new Blob([byteArray.buffer], { type: mimeType })
          : byteArray;

      const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("agent-documents")
        .upload(storagePath, fileBody, {
          contentType: mimeType,
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      await createDocumentRecord({
        fileName,
        fileSize,
        storagePath,
      });

      Alert.alert("Upload fuldført", `${fileName} er nu tilgængeligt for agenten.`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Kunne ikke uploade dokument.";
      Alert.alert("Upload fejlede", message);
    }
  }, [createDocumentRecord, documentsProcessing, supabase, user?.id]);

  const handleAutomationToggle = useCallback(
    (key, value) => {
      saveAutomation({ [key]: value }).catch(() => null);
    },
    [saveAutomation]
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
          />
        )}
      </AgentStack.Screen>
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
          />
        )}
      </AgentStack.Screen>
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
      <AgentStack.Screen
        name="AgentKnowledgeDocuments"
        options={{ title: "Dokumentbibliotek" }}
      >
        {(props) => (
          <AgentKnowledgeDocumentsScreen
            {...props}
            documents={documents}
            loading={documentsLoading}
            processing={documentsProcessing}
            onUploadDocument={handleUploadDocument}
          />
        )}
      </AgentStack.Screen>
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
