// Grundlæggende layout-beholder for agentsektioner med titel, indhold og footer.
import { View, Text, StyleSheet } from "react-native";
import { COLORS } from "../../styles/GlobalStyles";

export default function AgentSection({ title, subtitle, children, footer }) {
  // Standard kort-layout for agentens sektioner
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.body}>{children}</View>
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 24,
    padding: 22,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    shadowColor: "#05070F",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 18 },
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.muted,
  },
  body: {
    gap: 16,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "rgba(77, 124, 255, 0.08)",
    paddingTop: 16,
  },
});
