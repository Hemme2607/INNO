// Skærm der lister og opretter standardsvar for agenten.
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function AgentKnowledgeTemplatesScreen({
  navigation,
  templates = [],
  loading = false,
  processing = false,
}) {
  // Navigerer til editor for at oprette et nyt standardsvar
  const handleCreateTemplate = () => {
    navigation.navigate("AgentKnowledgeTemplateEditor");
  };

  // Åbner editoren med valgt template-id for redigering
  const handleEditTemplate = (templateId) => {
    navigation.navigate("AgentKnowledgeTemplateEditor", { templateId });
  };

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.heading}>Standardsvar</Text>
      <Text style={styles.subheading}>
        Her kan du oprette og redigere standardsvar, som agenten bruger som udgangspunkt til at personalisere svar.
      </Text>

      <TouchableOpacity
        style={[styles.primaryButton, processing && styles.primaryButtonDisabled]}
        activeOpacity={0.88}
        onPress={handleCreateTemplate}
        disabled={processing}
      >
        <Ionicons name="add-circle-outline" size={20} color={COLORS.text} />
        <Text style={styles.primaryButtonText}>Tilføj standardsvar</Text>
      </TouchableOpacity>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={COLORS.primary} />
          <Text style={styles.loadingText}>Henter standardsvar…</Text>
        </View>
      ) : templates.length ? (
        <View style={styles.list}>
          {templates.map((template) => (
            <TouchableOpacity
              key={template.id}
              style={styles.card}
              activeOpacity={0.88}
              onPress={() => handleEditTemplate(template.id)}
            >
              <Text style={styles.cardTitle}>{template.title}</Text>
              {template.description ? (
                <Text style={styles.cardDescription}>{template.description}</Text>
              ) : null}
              <Text style={styles.cardLink}>Redigér</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={24} color="rgba(148, 163, 196, 0.6)" />
          <Text style={styles.emptyTitle}>Ingen standardsvar endnu</Text>
          <Text style={styles.emptyDescription}>
            Opret dit første standardsvar for ofte stillede spørgsmål. Agenten bruger det som udgangspunkt og
            personaliserer svaret for hver kunde.
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
  cardLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
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
