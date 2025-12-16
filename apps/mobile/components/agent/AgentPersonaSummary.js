// Viser et overblik over agentens persona, signatur og seneste scenarie.
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AgentSection from "./AgentSection";
import { COLORS } from "../../styles/GlobalStyles";
import AgentSharedStyles from "../../styles/AgentSharedStyles";

export default function AgentPersonaSummary({
  onConfigurePress,
  signature,
  defaultSignature,
  displayName,
  shopDomain,
  scenario,
  instructions,
}) {
  // Beregn visninger og fallback-tekster til persona-overblikket
  const resolvedSignature = (signature && signature.trim()) || defaultSignature || "";
  const signatureLines = resolvedSignature
    ? resolvedSignature.split("\n").filter((line) => line.trim().length > 0)
    : [];
  const instructionPreview = instructions?.trim().split("\n").filter(Boolean)[0] ?? "Ingen instruktion angivet.";
  const scenarioPreview = scenario?.trim().split("\n").filter(Boolean)[0] ?? "Ingen kundesituation beskrevet.";
  const agentName = displayName?.trim()?.length ? displayName : "Din agent";

  return (
    <AgentSection
      title="Profil & tone of voice"
      subtitle="Kort overblik over hvordan agenten præsenterer sig selv."
      footer={
        <TouchableOpacity style={styles.footerCta} onPress={onConfigurePress} activeOpacity={0.85}>
          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
          <Text style={styles.footerCtaText}>Redigér signatur & instruktioner</Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.summaryRow}>
        <View style={[AgentSharedStyles.surfaceCard, styles.summaryCard]}>
          <Text style={[AgentSharedStyles.mutedLabel, styles.summaryLabel]}>Agentnavn</Text>
          <Text style={styles.summaryValue}>{agentName}</Text>
        </View>
        <View style={[AgentSharedStyles.surfaceCard, styles.summaryCard]}>
          <Text style={[AgentSharedStyles.mutedLabel, styles.summaryLabel]}>Instruktion</Text>
          <Text style={styles.summaryValue} numberOfLines={2}>
            {instructionPreview}
          </Text>
        </View>
        <View style={[AgentSharedStyles.surfaceCard, styles.summaryCard]}>
          <Text style={[AgentSharedStyles.mutedLabel, styles.summaryLabel]}>Shop</Text>
          <Text style={styles.summaryValue}>{shopDomain ?? "Ikke sat"}</Text>
        </View>
      </View>

      <View style={[AgentSharedStyles.surfaceCard, styles.scenarioCard]}>
        <Text style={[AgentSharedStyles.mutedLabel, styles.scenarioHeading]}>Seneste kundesituation</Text>
        <Text style={styles.scenarioText}>{scenarioPreview}</Text>
        {scenario?.trim()?.length ? null : (
          <Text style={styles.scenarioHint}>Tilføj en kort beskrivelse for at teste eksempelsvaret.</Text>
        )}
      </View>

      <View style={[AgentSharedStyles.surfaceCardAlt, styles.signatureCard]}>
        <Text style={[AgentSharedStyles.mutedLabel, styles.signatureHeading]}>Aktuel signatur</Text>
        {signatureLines.length ? (
          signatureLines.map((line, index) => (
            <Text key={`${line}-${index}`} style={styles.signatureLine}>
              {line}
            </Text>
          ))
        ) : (
          <Text style={styles.signaturePlaceholder}>Ingen signatur angivet endnu.</Text>
        )}
        {shopDomain ? (
          <Text style={styles.signatureMeta}>Shop: {shopDomain}</Text>
        ) : (
          <Text style={styles.signatureMeta}>Shop vises når Shopify er forbundet.</Text>
        )}
      </View>
    </AgentSection>
  );
}

const styles = StyleSheet.create({
  footerCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  footerCtaText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  summaryRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  summaryCard: {
    flexGrow: 1,
    minWidth: "30%",
    padding: 16,
    gap: 6,
  },
  summaryLabel: {
    fontSize: 12,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  signatureCard: {
    padding: 16,
    gap: 8,
  },
  signatureHeading: {
    fontSize: 13,
  },
  signatureLine: {
    fontSize: 14,
    color: COLORS.text,
  },
  signaturePlaceholder: {
    fontSize: 13,
    color: COLORS.muted,
    fontStyle: "italic",
  },
  signatureMeta: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.muted,
  },
  scenarioCard: {
    padding: 16,
    gap: 6,
  },
  scenarioHeading: {
    fontSize: 13,
  },
  scenarioText: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
  },
  scenarioHint: {
    fontSize: 12,
    color: COLORS.muted,
  },
});
