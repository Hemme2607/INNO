import { useMemo } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from "react-native";
import AgentSection from "./AgentSection";
import { COLORS } from "../../styles/GlobalStyles";

function buildPreviewText({ scenarioValue, instructionValue, signatureValue }) {
  const trimmedScenario = scenarioValue?.trim();
  const scenarioLine = trimmedScenario?.length ? trimmedScenario : "din forespørgsel";

  const trimmedInstruction = instructionValue?.trim();
  const instructionSentence = trimmedInstruction?.length
    ? `Jeg holder mig til dine retningslinjer: ${trimmedInstruction}.`
    : "Jeg holder tonen personlig, venlig og uden unødige formaliteter.";

  return [
    "Hej {navn},",
    "",
    `Tak fordi du skriver angående ${scenarioLine}. Jeg har kigget på det med det samme og sikrer, at du får en løsning, der matcher dine behov.`,
    "",
    instructionSentence,
    "",
    "Jeg vender tilbage med en opdatering hurtigst muligt – og du er altid velkommen til at svare direkte på denne besked, hvis der dukker nye detaljer op.",
    "",
    signatureValue || "",
  ]
    .filter(Boolean)
    .join("\n");
}

export default function AgentPersonaSection({
  signature,
  onSignatureChange,
  defaultSignature,
  scenario,
  onScenarioChange,
  instructions,
  onInstructionsChange,
}) {
  const resolvedSignature =
    signature && signature.trim().length ? signature : defaultSignature ?? "";

  const previewText = useMemo(
    () =>
      buildPreviewText({
        scenarioValue: scenario,
        instructionValue: instructions,
        signatureValue: resolvedSignature,
      }),
    [scenario, instructions, resolvedSignature],
  );

  return (
    <AgentSection
      title="Signatur & prompt"
      subtitle="Fortæl agenten hvordan den skal svare, og se et eksempel før du gemmer."
    >
      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Signatur</Text>
        <Text style={styles.fieldHint}>
          Efterlades feltet tomt, bruger vi automatisk:{" "}
          <Text style={styles.hintHighlight}>
            {defaultSignature || "Venlig hilsen\n[dit navn]\n[dine butik]"}
          </Text>
        </Text>
        <TextInput
          style={styles.textArea}
          multiline
          numberOfLines={4}
          placeholder={defaultSignature || "Venlig hilsen\nJonas\nmysports.dk"}
          placeholderTextColor="rgba(148, 163, 196, 0.6)"
          value={signature}
          onChangeText={onSignatureChange}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Kundesituation</Text>
        <Text style={styles.fieldHint}>
          Beskriv kort hvad kunden oplever lige nu. Det hjælper med at forme eksempelsvaret.
        </Text>
        <TextInput
          style={[styles.textArea, styles.largeTextArea]}
          multiline
          numberOfLines={4}
          placeholder="Fx: Kunden har modtaget en beskadiget vare og ønsker at høre om bytte eller refundering."
          placeholderTextColor="rgba(148, 163, 196, 0.6)"
          value={scenario}
          onChangeText={onScenarioChange}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.fieldLabel}>Svarinstruktioner (prompt)</Text>
        <Text style={styles.fieldHint}>
          Fortæl agenten hvordan den skal svare. Eksempler: &quot;Hold tonen venlig, brug ingen emojis&quot; eller
          &quot;Svar kortfattet og afslut med et klart næste skridt.&quot;
        </Text>
        <TextInput
          style={[styles.textArea, styles.largeTextArea]}
          multiline
          numberOfLines={4}
          placeholder="Fx: Hold tonen venlig og professionel, undgå emojis osv."
          placeholderTextColor="rgba(148, 163, 196, 0.6)"
          value={instructions}
          onChangeText={onInstructionsChange}
        />
      </View>

      <View style={styles.previewBlock}>
        <View style={styles.testButtonWrapper}>
          <TouchableOpacity style={styles.testButton} activeOpacity={0.9}>
            <Text style={styles.testButtonText}>Test svar</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.previewHeading}>Eksempel på svar</Text>
        <View style={styles.previewBox}>
          <Text style={styles.previewText}>{previewText}</Text>
        </View>
      </View>
    </AgentSection>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: 10,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  fieldHint: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
  hintHighlight: {
    color: COLORS.text,
    fontWeight: "600",
  },
  textArea: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.18)",
    backgroundColor: "rgba(10, 16, 28, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 20,
    textAlignVertical: "top",
  },
  largeTextArea: {
    minHeight: 110,
  },
  previewBlock: {
    gap: 16,
  },
  previewHeading: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  testButtonWrapper: {
    alignItems: "center",
  },
  testButton: {
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    minWidth: 140,
    alignItems: "center",
  },
  testButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  previewBox: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    backgroundColor: "rgba(9, 14, 24, 0.95)",
    padding: 18,
  },
  previewText: {
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
});
