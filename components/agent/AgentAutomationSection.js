import { useState } from "react";
import { View, Text, Switch, StyleSheet, Alert } from "react-native";
import AgentSection from "./AgentSection";
import { COLORS } from "../../styles/GlobalStyles";

const CONTROL_DEFINITIONS = [
  {
    id: "orderUpdates",
    title: "Opdater ordreoplysninger i Shopify",
    description: "Tillad agenten at rette leveringsadresse, kontaktinfo og tilføje ordre-noter på vegne af kunden.",
    defaultValue: true,
  },
  {
    id: "cancelOrders",
    title: "Annuller ordrer",
    description: "Tillad agenten at annullere åbne ordrer og informere kunden om næste skridt.",
    defaultValue: true,
  },
  {
    id: "automaticRefunds",
    title: "Gennemfør refunderinger automatisk",
    description: "Agenten kan oprette del- og fuldrefunderinger uden manuel godkendelse.",
    defaultValue: false,
  },
  {
    id: "historicInboxAccess",
    title: "Analysér tidligere mails",
    description: "Giv agenten adgang til tidligere besvarede mails for at lære tone, vendinger og standardsvar.",
    defaultValue: false,
  },
];

export default function AgentAutomationSection() {
  const [controlStates, setControlStates] = useState(() =>
    CONTROL_DEFINITIONS.reduce(
      (acc, control) => ({ ...acc, [control.id]: control.defaultValue }),
      {},
    ),
  );

  const handleToggle = (id, nextValue) => {
    const control = CONTROL_DEFINITIONS.find((item) => item.id === id);
    if (!control) {
      return;
    }

    if (controlStates[id] === nextValue) {
      return;
    }

    const confirmTitle = nextValue ? "Aktivér handling" : "Deaktivér handling";
    const confirmDescription = `${nextValue ? "Agenten får lov til" : "Agenten mister adgangen til"} "${control.title}".\n\n${control.description}`;

    Alert.alert(confirmTitle, confirmDescription, [
      {
        text: "Annullér",
        style: "cancel",
      },
      {
        text: nextValue ? "Aktivér" : "Deaktivér",
        onPress: () => {
          setControlStates((prev) => ({ ...prev, [id]: nextValue }));
        },
      },
    ]);
  };

  return (
    <AgentSection
      title="Automatisering & kvalitetssikring"
      subtitle="Styr hvornår agenten svarer automatisk, hvornår der skal godkendes, og hvordan fejl håndteres."
    >
      <View style={styles.toggleList}>
        {CONTROL_DEFINITIONS.map((control) => {
          const value = controlStates[control.id];
          return (
            <View key={control.id} style={styles.toggleCard}>
              <View style={styles.toggleCopy}>
                <Text style={styles.toggleTitle}>{control.title}</Text>
                <Text style={styles.toggleDescription}>{control.description}</Text>
              </View>
              <Switch
                value={value}
                onValueChange={(nextValue) => handleToggle(control.id, nextValue)}
                trackColor={{ false: "rgba(71, 85, 105, 0.45)", true: "rgba(77, 124, 255, 0.6)" }}
                thumbColor={value ? COLORS.primary : "#E2E8F0"}
              />
            </View>
          );
        })}
      </View>

      <View style={styles.helperBox}>
        <Text style={styles.helperTitle}>Anbefaling</Text>
        <Text style={styles.helperCopy}>
          Slå kun automatiske handlinger til når datakilderne er pålidelige, og du har sat klare
          godkendelsesregler for højrisko scenarier.
        </Text>
      </View>
    </AgentSection>
  );
}

const styles = StyleSheet.create({
  toggleList: {
    gap: 12,
  },
  toggleCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    backgroundColor: "rgba(10, 16, 28, 0.92)",
    padding: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 18,
  },
  toggleCopy: {
    flex: 1,
    gap: 6,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.muted,
  },
  helperBox: {
    marginTop: 8,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255, 229, 152, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(255, 208, 0, 0.24)",
    gap: 6,
  },
  helperTitle: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    color: "rgba(255, 214, 102, 0.92)",
  },
  helperCopy: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.text,
  },
});
