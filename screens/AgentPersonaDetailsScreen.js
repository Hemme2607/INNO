import { ScrollView, StyleSheet } from "react-native";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import AgentPersonaSection from "../components/agent/AgentPersonaSection";

export default function AgentPersonaDetailsScreen({
  personaConfig,
  onUpdatePersonaConfig,
  defaultSignature,
}) {
  const handleSignatureChange = (value) => {
    onUpdatePersonaConfig((prev) => ({ ...prev, signature: value }));
  };

  const handleScenarioChange = (value) => {
    onUpdatePersonaConfig((prev) => ({ ...prev, scenario: value }));
  };

  const handleInstructionsChange = (value) => {
    onUpdatePersonaConfig((prev) => ({ ...prev, instructions: value }));
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
      />
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
});
