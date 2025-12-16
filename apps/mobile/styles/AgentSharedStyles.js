// Fælles styles der går igen på tværs af agent-komponenterne.
import { StyleSheet } from "react-native";
import { COLORS } from "./GlobalStyles";

const AgentSharedStyles = StyleSheet.create({
  surfaceCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    backgroundColor: "rgba(12, 18, 33, 0.92)",
  },
  surfaceCardAlt: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    backgroundColor: "rgba(9, 14, 24, 0.92)",
  },
  mutedLabel: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "rgba(148, 163, 196, 0.95)",
    fontWeight: "600",
  },
});

export { AgentSharedStyles };
export default AgentSharedStyles;
