import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function AgentKnowledgeDocumentsScreen({
  documents = [],
  onUploadDocument = () => {},
  loading = false,
  processing = false,
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
        style={[styles.primaryButton, processing && styles.primaryButtonDisabled]}
        activeOpacity={0.88}
        onPress={onUploadDocument}
        disabled={processing}
      >
        <Ionicons name="cloud-upload-outline" size={20} color={COLORS.text} />
        <Text style={styles.primaryButtonText}>Upload dokument</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Henter dokumenter…</Text>
        </View>
      ) : documents.length ? (
        <View style={styles.list}>
          {documents.map((document) => (
            <View key={document.id} style={styles.card}>
              <Text style={styles.cardTitle}>{document.fileName}</Text>
              {document.fileSize ? (
                <Text style={styles.cardDescription}>Størrelse: {document.fileSize}</Text>
              ) : null}
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" size={24} color="rgba(148, 163, 196, 0.6)" />
          <Text style={styles.emptyTitle}>Ingen dokumenter endnu</Text>
          <Text style={styles.emptyDescription}>
            Upload produktguides, politikker eller FAQ-dokumenter for at give agenten mere viden at trække på.
          </Text>
        </View>
      )}
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
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  list: {
    gap: 12,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    fontSize: 13,
    color: COLORS.muted,
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
