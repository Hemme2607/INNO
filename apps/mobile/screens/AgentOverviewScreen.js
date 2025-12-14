// Skærm med samlet overblik over agentstatus, persona og data.
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
  onToggleAutoDraft,
}) {
  const isAgentActive = Boolean(automationSettings?.autoDraftEnabled);
  // Holder knaptekst i sync med autoDraft-flaget og viser spinner-tekst ved gem
  const heroLoading = automationSaving || automationLoading;
  const handleHeroPress = () => {
    if (heroLoading || typeof onToggleAutoDraft !== "function") return;
    onToggleAutoDraft(!isAgentActive);
  };

  const heroButtonLabel = heroLoading
    ? "Gemmer…"
    : isAgentActive
    ? "Deaktiver agent"
    : "Aktivér agent";
  const heroBadge = isAgentActive ? "Agent aktiv" : "Driftsklar";
  const heroButtonDisabled = heroLoading;
  const heroButtonIcon = isAgentActive ? "pause" : "rocket-outline";
  const heroButtonColors = isAgentActive
    ? ["#F97316", "#EA580C"]
    : [COLORS.primaryDark, COLORS.primary];

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
        <AgentHero
        onPrimaryActionPress={handleHeroPress}
        primaryActionLabel={heroButtonLabel}
        badgeLabel={heroBadge}
        primaryActionDisabled={heroButtonDisabled}
        primaryActionIcon={heroButtonIcon}
        primaryActionColors={heroButtonColors}
      />
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
