import { StyleSheet } from "react-native";

const COLORS = {
  primary: "#5B3DF6",
  primaryDark: "#3A1CCB",
  secondary: "#8C42FF",
  surface: "#FFFFFF",
  background: "#EEF0FF",
  text: "#1F1F39",
  muted: "#6E7191",
  success: "#41C98F",
  danger: "#FF4D4F",
};

const GlobalStyles = StyleSheet.create({
  // Shared layout
  screen: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  authBackground: { flex: 1 },
  authWrapper: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  // Cards
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 24,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 24,
  },

  // Typography
  heading: { fontSize: 28, fontWeight: "700", color: COLORS.text },
  subheading: {
    fontSize: 15,
    color: COLORS.muted,
    marginTop: 4,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
    marginBottom: 8,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
  },
  price: { fontSize: 16, fontWeight: "600", color: COLORS.primary },
  description: { fontSize: 15, color: COLORS.text },
  category: { fontSize: 14, color: COLORS.muted },

  // Inputs
  inputGroup: { marginBottom: 18 },
  input: {
    borderWidth: 1,
    borderColor: "#D8DAF2",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: "#F7F8FF",
  },

  // Buttons
  button: {
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPrimary: {
    marginTop: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
  },
  ghostButton: {
    marginTop: 16,
    alignItems: "center",
  },
  ghostButtonText: {
    fontSize: 14,
    color: COLORS.muted,
    textDecorationLine: "underline",
  },

  // Lists
  categoryList: {
    gap: 12,
    paddingVertical: 12,
  },
  categoryButton: {
    flex: 1,
    margin: 6,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8DAF2",
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#E8E5FF",
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },
  categoryButtonTextSelected: {
    color: COLORS.primaryDark,
  },
  categoryList: {
    justifyContent: "center",
    paddingVertical: 10,
  },

  // Info boxes
  infoBox: {
    backgroundColor: "#F7F8FF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },

  // Divider / helpers
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#E0E2F4",
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  // Social buttons
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  socialButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#E0E2F4",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: COLORS.surface,
  },
  socialButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.muted,
  },

  // Home screen
  homeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  homeHero: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 32,
  },
  homeHeroText: {
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: "700",
  },
  homeContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  homeCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 24,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  homeTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  homeSubtitle: {
    fontSize: 15,
    color: COLORS.muted,
    marginTop: 6,
  },
  homeButtonRow: {
    marginTop: 24,
    gap: 12,
  },
  logoutButton: { marginTop: 12 },
});

export { COLORS };
export default GlobalStyles;
