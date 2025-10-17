import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

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

export default function IntegrationsScreen() {
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.heading}>Integrationer</Text>
        <Text style={styles.subtitle}>
          Tilføj de systemer Sona skal kunne hente data fra.
        </Text>
      </View>

      {sections.map((section) => (
        <View key={section.id} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionDescription}>{section.description}</Text>

          <View style={styles.cardGrid}>
            {section.integrations.map((integration) => (
              <View key={integration.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.iconWrapper}>
                    <Ionicons
                      name={integration.icon}
                      size={20}
                      color={COLORS.primary}
                    />
                  </View>
                  <Text style={styles.cardTitle}>{integration.name}</Text>
                </View>
                <Text style={styles.cardDescription}>
                  {integration.description}
                </Text>
                <TouchableOpacity style={styles.cardButton} activeOpacity={0.9}>
                  <Text style={styles.cardButtonLabel}>Tilføj integration</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.muted,
  },
  cardGrid: {
    gap: 12,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDEBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
  },
  cardButton: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8DAF2",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F6F7FF",
  },
  cardButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
});
