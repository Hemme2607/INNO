// Skærm til at redigere agentens persona, scenarier og instruktioner.
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import AgentPersonaSection from "../components/agent/AgentPersonaSection";

export default function AgentPersonaDetailsScreen({
  personaConfig,
  onUpdatePersonaConfig,
  defaultSignature,
  onSavePersona,
  savingPersona = false,
  personaError = null,
  onTestPersona,
  testResult,
  testError,
  isTestingPersona = false,
}) {
  // Opdaterer persona-config i parent-state felt for felt
  const handleSignatureChange = (value) => {
    onUpdatePersonaConfig({ signature: value });
  };

  const handleScenarioChange = (value) => {
    onUpdatePersonaConfig({ scenario: value });
  };

  const handleInstructionsChange = (value) => {
    onUpdatePersonaConfig({ instructions: value });
  };

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <AgentPersonaSection
        signature={personaConfig?.signature ?? ""}
        onSignatureChange={handleSignatureChange}
        defaultSignature={defaultSignature}
        scenario={personaConfig?.scenario ?? ""}
        onScenarioChange={handleScenarioChange}
        instructions={personaConfig?.instructions ?? ""}
        onInstructionsChange={handleInstructionsChange}
        onTestPersona={onTestPersona}
        testResult={testResult}
        testError={testError}
        isTesting={isTestingPersona}
      />
      <View style={styles.footer}>
        {personaError ? <Text style={styles.errorText}>{personaError}</Text> : null}
        <TouchableOpacity
          style={[styles.saveButton, savingPersona && styles.saveButtonDisabled]}
          activeOpacity={0.9}
          onPress={onSavePersona}
          disabled={savingPersona}
        >
          {savingPersona ? (
            <ActivityIndicator color={COLORS.background} size="small" />
          ) : (
            <Text style={styles.saveButtonLabel}>Gem ændringer</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 28,
    backgroundColor: COLORS.background,
  },
  footer: {
    gap: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonLabel: {
    color: COLORS.background,
    fontWeight: "700",
    fontSize: 15,
  },
  errorText: {
    color: COLORS.error ?? "#ff6b6b",
    fontSize: 13,
  },
});
