import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "../../styles/GlobalStyles";

const DEFAULT_STATS = [
  { label: "løst ved første svar", value: "98%" },
  { label: "opsætningstid", value: "<5m" },
];

export default function AgentHero({
  title = "Agent Sona",
  subtitle = "Din AI-operator, der kombinerer kundedata, kontekst og tone of voice i ét svar.",
  badgeLabel = "Driftsklar",
  onPrimaryActionPress,
  primaryActionLabel = "Aktivér agent",
  stats = DEFAULT_STATS,
}) {
  return (
    <LinearGradient
      colors={["#1F2B45", "#141B2D"]}
      start={{ x: 0.05, y: 0 }}
      end={{ x: 0.95, y: 1 }}
      style={styles.heroCard}
    >
      <View style={styles.heroBadge}>
        <Ionicons name="shield-checkmark" size={16} color="#8EA8FF" />
        <Text style={styles.heroBadgeText}>{badgeLabel}</Text>
      </View>

      <View style={styles.heroHeader}>
        <View style={styles.heroIconWrapper}>
          <LinearGradient
            colors={["rgba(77, 124, 255, 0.35)", "rgba(106, 76, 255, 0.65)"]}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
            style={styles.heroIconBackground}
          >
            <MaterialCommunityIcons name="robot-happy-outline" size={38} color="#F0F4FF" />
          </LinearGradient>
        </View>
        <View style={styles.heroTextContainer}>
          <Text style={styles.heroTitle}>{title}</Text>
        </View>
      </View>

      <View style={styles.heroFooter}>
        {stats.map((stat, index) => (
          <View key={stat.label} style={styles.heroStat}>
            <Text style={styles.heroStatNumber}>{stat.value}</Text>
            <Text style={styles.heroStatLabel}>{stat.label}</Text>
            {index < stats.length - 1 ? <View style={styles.heroDivider} /> : null}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryAction} onPress={onPrimaryActionPress} activeOpacity={0.9}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.primaryActionGradient}
        >
          <Ionicons name="rocket-outline" size={18} color="#F5F8FF" />
          <Text style={styles.primaryActionText}>{primaryActionLabel}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: 28,
    padding: 26,
    gap: 20,
    borderWidth: 1,
    borderColor: "rgba(104, 132, 255, 0.18)",
    shadowColor: "#05070F",
    shadowOpacity: 0.5,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 22 },
    elevation: 12,
  },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(142, 168, 255, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadgeText: {
    color: "#C9D4FF",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  heroHeader: {
    flexDirection: "row",
    gap: 18,
    alignItems: "center",
  },
  heroIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(21, 31, 53, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#05070F",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  heroIconBackground: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTextContainer: {
    flex: 1,
    gap: 10,
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },
  heroSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(222, 230, 255, 0.84)",
  },
  heroFooter: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(12, 18, 33, 0.6)",
    borderRadius: 18,
    paddingVertical: 12,
  },
  heroStat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    position: "relative",
  },
  heroStatNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  heroStatLabel: {
    fontSize: 12,
    color: "#95A5D7",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  heroDivider: {
    position: "absolute",
    right: 0,
    width: 1,
    height: "70%",
    backgroundColor: "rgba(103, 132, 255, 0.35)",
  },
  primaryAction: {
    alignSelf: "flex-start",
    borderRadius: 16,
    overflow: "hidden",
  },
  primaryActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  primaryActionText: {
    color: "#F5F8FF",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
});
