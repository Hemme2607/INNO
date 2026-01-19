// Skærm hvor brugeren kan uploade, se og fjerne vidensdokumenter.
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function AgentKnowledgeDocumentsScreen({
  onUploadDocument = () => {},
  warningMessage = null,
}) {
  // Viser placeholder for dokumentbiblioteket og lader brugeren trigge upload-flowet
  return (
    <ScrollView
      // Standard baggrund
      style={GlobalStyles.screen}
      // Indholdsstil for spacing
      contentContainerStyle={styles.contentContainer}
      // Skjul scrollbar
      showsVerticalScrollIndicator={false}
    >
      {/* Overskrift og intro */}
      <Text style={styles.heading}>Dokumentbibliotek</Text>
      <Text style={styles.subheading}>
        Upload og administrer dokumenter, som agenten kan bruge til at hente fakta og procedurer.
      </Text>

      <TouchableOpacity
        // Primær CTA til upload (placeholder)
        style={styles.primaryButton}
        activeOpacity={0.88}
        onPress={onUploadDocument}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={COLORS.text} />
        <Text style={styles.primaryButtonText}>Upload dokument (kommer snart)</Text>
      </TouchableOpacity>

      <View style={styles.emptyState}>
        {/* Tom-tilstand for kommende funktion */}
        <Ionicons name="sparkles" size={28} color={COLORS.primary} />
        <Text style={styles.emptyTitle}>Dokumentbibliotek på vej</Text>
        <Text style={styles.emptyDescription}>
          Vi arbejder på en forbedret dokumentoplevelse. Snart kan du uploade og organisere filer direkte her.
        </Text>
        {warningMessage ? (
          // Ekstra advarselstekst hvis den er givet
          <Text style={[styles.emptyDescription, styles.warningText]}>{warningMessage}</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    // Standard spacing og baggrund
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 18,
    backgroundColor: COLORS.background,
  },
  heading: {
    // Overskriftstypografi
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  subheading: {
    // Undertekst for kontekst
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  primaryButton: {
    // Primær knap-stil
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
    // Tekst til knappen
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  warningText: {
    // Ekstra tekst til advarsel
    color: COLORS.warning,
    marginTop: 8,
  },
  emptyState: {
    // Tom-state container
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
    // Titel i tom-state
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyDescription: {
    // Beskrivelse i tom-state
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    textAlign: "center",
  },
});
