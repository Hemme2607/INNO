// Skærm der beskriver og håndterer appens integrationer.
import { useState, useCallback } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { View, Text, TouchableOpacity, ScrollView, Image, Modal, TextInput, ActivityIndicator, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { useClerkSupabase } from "../lib/supabaseClient";
import { useShopDomain } from "../lib/hooks/useShopDomain";

// Indhold til integrationssektioner
const sections = [
  {
    id: "mail",
    title: "Mail",
    description:
      "Forbind din primære indbakke, så Sona kan hente nye henvendelser.",
    integrations: [
      {
        id: "gmail",
        name: "Gmail",
        description: "Importer labels, tråd-historik og vedhæftede filer.",
        logo: require("../../../assets/google-logo.png"),
      },
      {
        id: "outlook",
        name: "Outlook",
        description: "Synkroniser indbakker og send svar via Microsoft 365.",
        logo: require("../../../assets/Microsoft-logo.png"),
      },
    ],
  },
  {
    id: "webshop",
    title: "Webshopdata",
    description:
      "Projekter ordrestatus og kundedata direkte ind i AI-besvarelser.",
    integrations: [
      {
        id: "shopify",
        name: "Shopify",
        description: "Hent ordre, returneringer og kundesegmenter automatisk.",
        logo: require("../../../assets/Shopify-Logo.png"),
        logoStyle: GlobalStyles.integrationIconImageLarge,
      },
    ],
  },
];

export default function IntegrationsScreen() {
  // Clerk token til edge functions
  const { getToken } = useAuth();
  // Supabase klient via Clerk auth
  const supabase = useClerkSupabase();
  const {
    shopDomain: shopifyConnectedDomain,
    ownerUserId: shopifyOwnerUserId,
    isLoaded: isShopDomainLoaded,
    refresh: refreshShopDomain,
  } =
    useShopDomain();
  // Modal-state til Shopify
  const [shopifyModalVisible, setShopifyModalVisible] = useState(false);
  // Input-felter i modal
  const [shopifyDomainInput, setShopifyDomainInput] = useState("");
  const [shopifyTokenInput, setShopifyTokenInput] = useState("");
  // Fejlbesked til Shopify
  const [shopifyError, setShopifyError] = useState(null);
  // Loader mens shop-domæne hentes
  const isLoadingConnection = !isShopDomainLoaded;
  // Loader til alle mutationer
  const [isMutating, setIsMutating] = useState(false);
  // Loader til test af Shopify
  const [isTestingShopify, setIsTestingShopify] = useState(false);

  // Base URL til Supabase functions
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const functionsBase = supabaseUrl ? `${supabaseUrl}/functions/v1` : null;

  // Rens og normaliser domæne
  const normalizeDomain = useCallback(
    (value) =>
      value.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "").toLowerCase(),
    [],
  );

  // Åbner modal med eksisterende butik udfyldt så brugeren kan opdatere
  const openShopifyModal = () => {
    // Ryd fejl og indsæt nuværende domæne
    setShopifyError(null);
    setShopifyDomainInput(shopifyConnectedDomain ?? "");
    setShopifyTokenInput("");
    setShopifyModalVisible(true);
  };

  // Gemmer Shopify domæne + token via edge function og opdaterer lokal state
  const connectShopify = async () => {
    if (!functionsBase) {
      setShopifyError("Supabase url ikke sat i miljøvariabler.");
      return;
    }
    // Normaliser input før vi sender det
    const domain = normalizeDomain(shopifyDomainInput);
    const tokenValue = shopifyTokenInput.trim();

    if (!domain) {
      setShopifyError("Indtast dit Shopify domæne.");
      return;
    }

    if (!tokenValue) {
      setShopifyError("Indtast admin API adgangstoken fra Shopify.");
      return;
    }

    // Start loader
    setIsMutating(true);
    setShopifyError(null);

    try {
      // Hent Clerk token til edge function
      const sessionToken = await getToken();
      if (!sessionToken) {
        throw new Error("Kunne ikke hente Clerk session token.");
      }

      // Kald edge function der gemmer integrationen
      const response = await fetch(`${functionsBase}/shopify-connect`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain,
          accessToken: tokenValue,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const message = errorBody?.error || `Kunne ikke forbinde Shopify (${response.status}).`;
        throw new Error(message);
      }

      // Opdater lokal data og luk modal
      await refreshShopDomain();
      setShopifyModalVisible(false);
      setShopifyTokenInput("");
      Alert.alert("Shopify forbundet", `Butikken ${domain} er nu tilsluttet.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl ved forbindelse til Shopify.";
      setShopifyError(message);
    } finally {
      // Stop loader
      setIsMutating(false);
    }
  };

  // Fjerner shopify-rækken i Supabase når brugeren frakobler
  const disconnectShopify = async () => {
    if (!shopifyConnectedDomain || !supabase) {
      return;
    }

    // Start loader
    setIsMutating(true);
    try {
      const { error } = await supabase
        .from("shops")
        .delete()
        .eq("shop_domain", shopifyConnectedDomain);

      if (error) {
        throw error;
      }

      // Opdater lokal data og luk modal
      await refreshShopDomain();
      setShopifyModalVisible(false);
      Alert.alert("Shopify frakoblet", "Butikken er fjernet fra din konto.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ukendt fejl ved frakobling af Shopify.";
      Alert.alert("Kunne ikke fjerne integrationen", message);
    } finally {
      // Stop loader
      setIsMutating(false);
    }
  };

  // Tester om den gemte Shopify-forbindelse stadig svarer på API-kald
  const testShopifyConnection = useCallback(async () => {
    if (!functionsBase || !supabase) {
      Alert.alert("Shopify test", "Supabase miljøvariabler mangler.");
      return;
    }

    // Start test-loader
    setIsTestingShopify(true);
    try {
      // Token til edge function
      const clerkToken = await getToken();
      if (!clerkToken) {
        throw new Error("Kunne ikke hente Clerk session token.");
      }

      const response = await fetch(`${functionsBase}/shopify-orders?limit=1`, {
        headers: {
          Authorization: `Bearer ${clerkToken}`,
        },
      });

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message =
          typeof payload?.error === "string"
            ? payload.error
            : `Shopify endpoint svarede ${response.status}.`;
        throw new Error(message);
      }

      // Vis status med antal ordre i testen
      const orderCount = Array.isArray(payload?.orders) ? payload.orders.length : 0;
      Alert.alert(
        "Shopify test",
        orderCount
          ? `Forbindelsen virker. Modtog ${orderCount} ordre${orderCount === 1 ? "" : "r"} i testkaldet.`
          : "Forbindelsen virker. Ingen ordre blev returneret i testkaldet."
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ukendt fejl under testen.";
      Alert.alert("Shopify test fejlede", message);
    } finally {
      // Stop test-loader
      setIsTestingShopify(false);
    }
  }, [functionsBase, supabase]);

  // Bekræfter med brugeren før integrationen slettes
  const confirmDisconnectShopify = () => {
    if (!shopifyConnectedDomain) return;
    // Native alert med bekræftelse
    Alert.alert(
      "Fjern Shopify",
      "Er du sikker på, at du vil fjerne forbindelsen til Shopify?",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Fjern",
          style: "destructive",
          onPress: disconnectShopify,
        },
      ]
    );
  };

  // Placeholder for andre integrationer indtil de implementeres
  const handleGenericIntegration = (name) => {
    // Vis besked om at det kommer snart
    Alert.alert("Kommer snart", `${name} integrationen er på vej. Indtil da kan du forbinde Shopify.`);
  };

  return (
    <LinearGradient
      // Baggrundsgradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      // Retning for gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      // Container-stil
      style={GlobalStyles.integrationsScreen}
    >
      <ScrollView
        // Fyld pladsen
        style={{ flex: 1 }}
        // Indholdsstil med padding
        contentContainerStyle={GlobalStyles.integrationsContent}
        // Skjul scrollbar
        showsVerticalScrollIndicator={false}
      >
        <View style={GlobalStyles.integrationsHeader}>
          {/* Overskrift og intro */}
          <Text style={GlobalStyles.integrationsHeading}>Integrationer</Text>
          <Text style={GlobalStyles.integrationsSubtitle}>
            Tilføj de systemer Sona skal kunne hente data fra.
          </Text>
        </View>

        {sections.map((section) => (
          <View key={section.id} style={GlobalStyles.integrationSection}>
            <Text style={GlobalStyles.integrationSectionTitle}>
              {section.title}
            </Text>
            <Text style={GlobalStyles.integrationSectionDescription}>
              {section.description}
            </Text>

            <View style={GlobalStyles.integrationCardGrid}>
              {section.integrations.map((integration) => {
                // Vi har ekstra logik for Shopify
                const isShopify = integration.id === "shopify";
                const buttonLabel = isShopify
                  ? shopifyConnectedDomain
                    ? "Administrer Shopify"
                    : "Tilføj Shopify"
                  : "Tilføj integration";

                const onPress = isShopify
                  ? openShopifyModal
                  : () => handleGenericIntegration(integration.name);

                return (
                  <View key={integration.id} style={GlobalStyles.integrationCard}>
                    <View style={GlobalStyles.integrationCardHeader}>
                      <View style={GlobalStyles.integrationIconWrapper}>
                        {integration.logo ? (
                          // Brug logo-billede hvis det findes
                          <Image
                            source={integration.logo}
                            style={[
                              GlobalStyles.integrationIconImage,
                              integration.logoStyle,
                            ]}
                          />
                        ) : (
                          // Fallback til ikon
                          <Ionicons
                            name={integration.icon}
                            size={20}
                            color={COLORS.primary}
                          />
                        )}
                      </View>
                      {/* Integrationens navn */}
                      <Text style={GlobalStyles.integrationCardTitle}>
                        {integration.name}
                      </Text>
                    </View>
                    {/* Beskrivelse af integrationen */}
                    <Text style={GlobalStyles.integrationCardDescription}>
                      {integration.description}
                    </Text>
                    {isShopify && shopifyConnectedDomain ? (
                      <>
                        {/* Status for tilsluttet butik */}
                        <Text style={GlobalStyles.integrationCardStatus}>
                          Forbundet til {shopifyConnectedDomain}
                        </Text>
                        {shopifyOwnerUserId ? (
                          <Text style={GlobalStyles.integrationCardStatus}>
                            Owner ID: {shopifyOwnerUserId}
                          </Text>
                        ) : null}
                      </>
                    ) : null}
                    <TouchableOpacity
                      // Knap til at forbinde/administrere integrationen
                      style={GlobalStyles.integrationCardButton}
                      activeOpacity={0.9}
                      onPress={onPress}
                      disabled={isShopify && (isLoadingConnection || isMutating)}
                    >
                      <Text style={GlobalStyles.integrationCardButtonLabel}>
                        {buttonLabel}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {shopifyConnectedDomain ? (
          <View style={GlobalStyles.integrationSection}>
            <Text style={GlobalStyles.integrationSectionTitle}>Shopify status</Text>
            <View style={GlobalStyles.integrationCard}>
              <View style={GlobalStyles.integrationCardHeader}>
                <View style={GlobalStyles.integrationIconWrapper}>
                  <Image
                    source={require("../../../assets/Shopify-Logo.png")}
                    style={[
                      GlobalStyles.integrationIconImage,
                      GlobalStyles.integrationIconImageLarge,
                    ]}
                  />
                </View>
                <Text style={GlobalStyles.integrationCardTitle}>Forbundet butik</Text>
              </View>
              <Text style={GlobalStyles.integrationCardDescription}>
                {`Domæne: ${shopifyConnectedDomain}`}
              </Text>
              {shopifyOwnerUserId ? (
                <Text style={GlobalStyles.integrationCardDescription}>
                  {`Owner ID: ${shopifyOwnerUserId}`}
                </Text>
              ) : null}
              <TouchableOpacity
                // Knap til at teste forbindelsen
                style={GlobalStyles.integrationCardButton}
                activeOpacity={0.9}
                onPress={testShopifyConnection}
                disabled={isTestingShopify}
              >
                {isTestingShopify ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Text style={GlobalStyles.integrationCardButtonLabel}>Test forbindelse</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <Modal
        // Modal til at forbinde Shopify
        transparent
        visible={shopifyModalVisible}
        animationType="fade"
        onRequestClose={() => {
          if (!isMutating) {
            setShopifyModalVisible(false);
          }
        }}
      >
        <View style={GlobalStyles.integrationModalBackdrop}>
          <View style={GlobalStyles.integrationModalCard}>
            <Text style={GlobalStyles.integrationModalTitle}>
              {shopifyConnectedDomain
                ? "Administrer Shopify"
                : "Tilslut Shopify"}
            </Text>
            <Text style={GlobalStyles.integrationModalDescription}>
              Indtast dit Shopify domæne samt Admin API adgangstoken fra Shopify
              Admin ({`Apps > Develop apps > API credentials`}). Tokenet gemmes sikkert i Supabase.
            </Text>

            <View style={GlobalStyles.integrationModalField}>
              <Text style={GlobalStyles.integrationModalLabel}>
                Butiksdomæne
              </Text>
              <TextInput
                style={GlobalStyles.integrationModalInput}
                placeholder="your-store.myshopify.com"
                placeholderTextColor="rgba(228, 234, 255, 0.35)"
                value={shopifyDomainInput}
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setShopifyDomainInput}
              />
            </View>

            <View style={GlobalStyles.integrationModalField}>
              <Text style={GlobalStyles.integrationModalLabel}>
                Admin API adgangstoken
              </Text>
              <TextInput
                style={GlobalStyles.integrationModalInput}
                placeholder="Skabt via Shopify Admin"
                placeholderTextColor="rgba(228, 234, 255, 0.35)"
                value={shopifyTokenInput}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setShopifyTokenInput}
              />
            </View>

            {shopifyError ? (
              // Fejlbesked i modal
              <Text style={GlobalStyles.integrationModalError}>
                {shopifyError}
              </Text>
            ) : null}

            {isMutating ? (
              // Loader mens vi gemmer eller fjerner
              <View style={GlobalStyles.integrationModalLoading}>
                <ActivityIndicator size="small" color={COLORS.primary} />
                <Text style={GlobalStyles.integrationModalHint}>
                  Arbejder...
                </Text>
              </View>
            ) : null}

            <View style={GlobalStyles.integrationModalActions}>
              <TouchableOpacity
                style={[
                  GlobalStyles.integrationModalPrimary,
                  isMutating && { opacity: 0.5 },
                ]}
                onPress={connectShopify}
                activeOpacity={0.9}
                disabled={isMutating}
              >
                <Text style={GlobalStyles.integrationModalPrimaryLabel}>
                  {shopifyConnectedDomain
                    ? "Opdater forbindelse"
                    : "Tilslut Shopify"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={GlobalStyles.integrationModalGhost}
                onPress={() => {
                  if (!isMutating) {
                    setShopifyModalVisible(false);
                  }
                }}
                activeOpacity={0.9}
                disabled={isMutating}
              >
                <Text style={GlobalStyles.integrationModalGhostLabel}>
                  Luk
                </Text>
              </TouchableOpacity>
            </View>

            {shopifyConnectedDomain ? (
              <TouchableOpacity
                style={GlobalStyles.integrationModalDisconnect}
                onPress={confirmDisconnectShopify}
                activeOpacity={0.8}
                disabled={isMutating}
              >
                <Text style={GlobalStyles.integrationModalDisconnectLabel}>
                  Fjern integration
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}
