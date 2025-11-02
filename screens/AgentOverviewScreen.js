import { ScrollView, StyleSheet } from "react-native";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import AgentHero from "../components/agent/AgentHero";
import AgentPersonaSummary from "../components/agent/AgentPersonaSummary";
import AgentKnowledgeSection from "../components/agent/AgentKnowledgeSection";
import AgentAutomationSection from "../components/agent/AgentAutomationSection";

export default function AgentOverviewScreen({
  onOpenPersona,
  onOpenTemplates,
  onOpenDocuments,
  personaConfig,
  defaultSignature,
  displayName,
  shopDomain,
  automationSettings,
  automationLoading,
  automationSaving,
  automationError,
  automationDefaults,
  onAutomationToggle,
}) {
  const handleActivateAgent = () => {};

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <AgentHero onPrimaryActionPress={handleActivateAgent} />
      <AgentPersonaSummary
        onConfigurePress={onOpenPersona}
        signature={personaConfig?.signature ?? ""}
        defaultSignature={defaultSignature}
        displayName={displayName}
        shopDomain={shopDomain}
        scenario={personaConfig?.scenario ?? ""}
        instructions={personaConfig?.instructions ?? ""}
      />
      <AgentKnowledgeSection onOpenTemplates={onOpenTemplates} onOpenDocuments={onOpenDocuments} />
      <AgentAutomationSection
        settings={automationSettings}
        loading={automationLoading}
        saving={automationSaving}
        error={automationError}
        defaults={automationDefaults}
        onToggle={onAutomationToggle}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 28,
    backgroundColor: COLORS.background,
  },
});
