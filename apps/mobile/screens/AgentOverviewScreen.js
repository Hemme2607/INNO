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
  // Er auto-draft aktiv?
  const isAgentActive = Boolean(automationSettings?.autoDraftEnabled);
  // Holder knaptekst i sync med autoDraft-flaget og viser spinner-tekst ved gem
  const heroLoading = automationSaving || automationLoading;
  // Toggler auto-draft status via handler fra props
  const handleHeroPress = () => {
    if (heroLoading || typeof onToggleAutoDraft !== "function") return;
    onToggleAutoDraft(!isAgentActive);
  };

  // Tekst og styling baseret på agent-status
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
      // Standard baggrundsstil
      style={GlobalStyles.screen}
      // Indholdsstil for spacing
      contentContainerStyle={styles.contentContainer}
      // Skjul scrollbar
      showsVerticalScrollIndicator={false}
    >
      {/* Hero-område med status og CTA */}
      <AgentHero
        onPrimaryActionPress={handleHeroPress}
        primaryActionLabel={heroButtonLabel}
        badgeLabel={heroBadge}
        primaryActionDisabled={heroButtonDisabled}
        primaryActionIcon={heroButtonIcon}
        primaryActionColors={heroButtonColors}
      />
      {/* Persona-resume med info og genveje */}
      <AgentPersonaSummary
        onConfigurePress={onOpenPersona}
        signature={personaConfig?.signature ?? ""}
        defaultSignature={defaultSignature}
        displayName={displayName}
        shopDomain={shopDomain}
        scenario={personaConfig?.scenario ?? ""}
        instructions={personaConfig?.instructions ?? ""}
      />
      {/* Sektion med skabeloner og dokumenter */}
      <AgentKnowledgeSection onOpenTemplates={onOpenTemplates} onOpenDocuments={onOpenDocuments} />
      {/* Automation-indstillinger */}
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
    // Ens spacing og baggrund for hele skærmen
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 28,
    backgroundColor: COLORS.background,
  },
});
