import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

// Data for integrationssektionerne
const sections = [
  {
    id: "mail",
    title: "Mail",
    description: "Forbind din primære indbakke, så Sona kan hente nye henvendelser.",
    integrations: [
      {
        id: "gmail",
        name: "Gmail",
        description: "Importer labels, tråd-historik og vedhæftede filer.",
        icon: "logo-google",
      },
      {
        id: "outlook",
        name: "Outlook",
        description: "Synkroniser indbakker og send svar via Microsoft 365.",
        icon: "mail-outline",
      },
    ],
  },
  {
    id: "webshop",
    title: "Webshopdata",
    description: "Projekter ordrestatus og kundedata direkte ind i AI-besvarelser.",
    integrations: [
      {
        id: "shopify",
        name: "Shopify",
        description: "Hent ordre, returneringer og kundesegmenter automatisk.",
        icon: "cart-outline",
      },
    ],
  },
];

// IntegrationsScreen-komponenten med GlobalStyles
export default function IntegrationsScreen() {
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={GlobalStyles.integrationsScreen}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={GlobalStyles.integrationsContent}
        showsVerticalScrollIndicator={false}
      >
      <View style={GlobalStyles.integrationsHeader}>
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
            {section.integrations.map((integration) => (
              <View key={integration.id} style={GlobalStyles.integrationCard}>
                <View style={GlobalStyles.integrationCardHeader}>
                  <View style={GlobalStyles.integrationIconWrapper}>
                    <Ionicons
                      name={integration.icon}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={GlobalStyles.integrationCardTitle}>
                    {integration.name}
                  </Text>
                </View>
                <Text style={GlobalStyles.integrationCardDescription}>
                  {integration.description}
                </Text>
                <TouchableOpacity
                  style={GlobalStyles.integrationCardButton}
                  activeOpacity={0.9}
                >
                  <Text style={GlobalStyles.integrationCardButtonLabel}>
                    Tilføj integration
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ))}
      </ScrollView>
    </LinearGradient>
  );
}
