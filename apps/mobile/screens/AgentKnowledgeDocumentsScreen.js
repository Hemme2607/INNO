import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function AgentKnowledgeDocumentsScreen({
  onUploadDocument = () => {},
  warningMessage = null,
}) {
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

      <TouchableOpacity
        style={styles.primaryButton}
        activeOpacity={0.88}
        onPress={onUploadDocument}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={COLORS.text} />
        <Text style={styles.primaryButtonText}>Upload dokument (kommer snart)</Text>
      </TouchableOpacity>

      <View style={styles.emptyState}>
        <Ionicons name="sparkles" size={28} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>Dokumentbibliotek på vej</Text>
        <Text style={styles.emptyDescription}>
          Vi arbejder på en forbedret dokumentoplevelse. Snart kan du uploade og organisere filer direkte her.
        </Text>
        {warningMessage ? (
          <Text style={[styles.emptyDescription, styles.warningText]}>{warningMessage}</Text>
        ) : null}
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
  warningText: {
    color: COLORS.warning,
    marginTop: 8,
  },
  emptyState: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    backgroundColor: "rgba(12, 18, 33, 0.9)",
    padding: 22,
    gap: 10,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    textAlign: "center",
  },
});
