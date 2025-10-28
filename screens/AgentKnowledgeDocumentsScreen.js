import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

const dummyDocuments = [
  { id: "return-policy", name: "Returneringspolitik.pdf", size: "320 KB" },
  { id: "shipping-guide", name: "Leveringsinformation.docx", size: "190 KB" },
];

export default function AgentKnowledgeDocumentsScreen() {
  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Dokumentbibliotek</Text>
      <Text style={styles.subheading}>
        Upload og administrer dokumenter, som agenten kan bruge til at hente fakta og procedurer.
      </Text>

      <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88}>
        <Ionicons name="cloud-upload-outline" size={20} color={COLORS.text} />
        <Text style={styles.primaryButtonText}>Upload dokument</Text>
      </TouchableOpacity>

      <View style={styles.list}>
        {dummyDocuments.map((document) => (
          <View key={document.id} style={styles.card}>
            <Text style={styles.cardTitle}>{document.name}</Text>
            <Text style={styles.cardDescription}>Størrelse: {document.size}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 18,
    backgroundColor: COLORS.background,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  primaryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.16)",
    backgroundColor: "rgba(11, 16, 27, 0.92)",
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  list: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.16)",
    backgroundColor: "rgba(11, 16, 27, 0.92)",
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },
});
