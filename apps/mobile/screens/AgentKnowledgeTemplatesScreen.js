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
    // Åbner editor uden template-id
    navigation.navigate("AgentKnowledgeTemplateEditor");
  };

  // Åbner editoren med valgt template-id for redigering
  const handleEditTemplate = (templateId) => {
    // Sender template-id med til editor
    navigation.navigate("AgentKnowledgeTemplateEditor", { templateId });
  };

  return (
    <ScrollView
      // Skærmens standard-baggrund
      style={GlobalStyles.screen}
      // Indholdsstil med padding
      contentContainerStyle={styles.contentContainer}
      // Skjul scrollbar
      showsVerticalScrollIndicator={false}
    >
      {/* Overskrift og intro */}
      <Text style={styles.heading}>Standardsvar</Text>
      <Text style={styles.subheading}>
        Her kan du oprette og redigere standardsvar, som agenten bruger som udgangspunkt til at personalisere svar.
      </Text>

      <TouchableOpacity
        // Primær CTA til at tilføje nyt standardsvar
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
          {/* Loader mens data hentes */}
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
              {/* Titel og beskrivelse for template */}
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
          {/* Tom-tilstand når der ikke findes templates */}
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
    // Standard spacing til skærmen
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
  primaryButtonDisabled: {
    // Vis disabled-state
    opacity: 0.75,
  },
  primaryButtonText: {
    // Tekst til primær knap
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  list: {
    // Liste med cards
    gap: 12,
  },
  loadingRow: {
    // Layout for loader-rækken
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    // Tekst ved loading
    fontSize: 13,
    color: COLORS.muted,
  },
  card: {
    // Card-stil for hver template
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.16)",
    backgroundColor: "rgba(11, 16, 27, 0.92)",
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    // Titel i card
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardDescription: {
    // Beskrivelse i card
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },
  cardLink: {
    // Tekst til redigering
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
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
