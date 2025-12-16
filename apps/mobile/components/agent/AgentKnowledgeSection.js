// UI-sektion til at åbne standardsvar og dokumenter for agentens vidensbase.
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AgentSection from "./AgentSection";
import { COLORS } from "../../styles/GlobalStyles";
import AgentSharedStyles from "../../styles/AgentSharedStyles";

export default function AgentKnowledgeSection({
  onOpenTemplates = () => {},
  onOpenDocuments = () => {},
}) {
  // Viser CTA-knapper til at åbne templates og dokumenter
  return (
    <AgentSection
      title="Viden & datakilder"
      subtitle="Tilføj standardsvar og dokumenter som agenten kan bruge sammen med dine integrationer."
    >
      <View style={styles.buttonStack}>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88} onPress={onOpenTemplates}>
          <Ionicons name="chatbox-ellipses-outline" size={20} color={COLORS.text} />
          <View style={styles.buttonCopy}>
            <Text style={styles.buttonTitle}>Definér standardsvar</Text>
            <Text style={styles.buttonSubtitle}>
              Opret udkast til gentagne henvendelser. Agenten personaliserer dem automatisk til kunden.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(226, 232, 240, 0.7)" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88} onPress={onOpenDocuments}>
          <Ionicons name="cloud-upload-outline" size={20} color={COLORS.text} />
          <View style={styles.buttonCopy}>
            <Text style={styles.buttonTitle}>Upload dokumenter</Text>
            <Text style={styles.buttonSubtitle}>
              Tilføj guides, politikker og FAQ, så agenten kan citere korrekt information.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="rgba(226, 232, 240, 0.7)" />
        </TouchableOpacity>
      </View>

      <View style={[AgentSharedStyles.surfaceCard, styles.infoCard]}>
        <Ionicons name="sparkles-outline" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>
          Integrationer (fx Shopify) administreres under fanen &quot;Integrationer&quot; og er tilgængelige i
          agentens svar automatisk.
        </Text>
      </View>
    </AgentSection>
  );
}

const styles = StyleSheet.create({
  buttonStack: {
    gap: 12,
  },
  primaryButton: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.16)",
    backgroundColor: "rgba(11, 16, 27, 0.92)",
    paddingVertical: 16,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  buttonCopy: {
    flex: 1,
    gap: 4,
  },
  buttonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  buttonSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,
  },
  infoCard: {
    marginTop: 12,
    padding: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.muted,
  },
});
