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

  // Auth screen helpers
  authBrandTitle: {
    color: COLORS.surface,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  authBrandSubtitle: {
    color: "#E5E6FF",
    fontSize: 15,
    textAlign: "center",
    marginTop: 4,
  },
  authToggleContainer: {
    marginTop: 28,
    alignItems: "center",
  },
  authToggleCopy: {
    color: COLORS.muted,
    fontSize: 14,
  },
  authToggleLink: {
    marginTop: 6,
  },

  // Home screen
  homeScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 72,
    gap: 16,
  },
  homeScreenHeader: {
    gap: 8,
  },
  homeScreenGreeting: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  homeScreenIntro: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  },
  homeScreenCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    gap: 14,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  homeScreenCardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  homeScreenCardDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
  },
  homeScreenCardButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  homeScreenCardButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  homeScreenCardButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },

  // Inbox screen
  inboxScreen: {
    flex: 1,
    backgroundColor: "#F6F7FB",
  },
  inboxTopDivider: {
    height: 12,
    backgroundColor: "#F6F7FB",
  },
  inboxHeader: {
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 20,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E4E6F4",
  },
  inboxHeading: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },
  inboxSubtitle: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 4,
  },
  inboxHeaderButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECEEFA",
    alignItems: "center",
    justifyContent: "center",
  },
  inboxListContent: {
    padding: 16,
  },
  inboxListEmptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  inboxSeparator: {
    height: 12,
  },
  inboxRow: {
    flexDirection: "row",
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: "#141736",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  inboxAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  inboxAvatarLabel: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  inboxRowContent: {
    flex: 1,
    gap: 6,
  },
  inboxRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  inboxSender: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  inboxTime: {
    fontSize: 12,
    color: COLORS.muted,
  },
  inboxSubject: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  inboxPreview: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  inboxEmptyState: {
    alignItems: "center",
    gap: 8,
  },
  inboxEmptyHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  inboxEmptySubtitle: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
    lineHeight: 20,
  },

  // Integrations screen
  integrationsScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  integrationsContent: {
    paddingBottom: 40,
  },
  integrationsHeader: {
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 20,
    backgroundColor: COLORS.background,
    gap: 8,
  },
  integrationsHeading: {
    fontSize: 26,
    fontWeight: "700",
    color: COLORS.text,
  },
  integrationsSubtitle: {
    fontSize: 14,
    color: COLORS.muted,
  },
  integrationSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    gap: 16,
  },
  integrationSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
  },
  integrationSectionDescription: {
    fontSize: 14,
    color: COLORS.muted,
  },
  integrationCardGrid: {
    gap: 12,
  },
  integrationCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 18,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  integrationCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  integrationIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDEBFF",
    alignItems: "center",
    justifyContent: "center",
  },
  integrationCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
  },
  integrationCardDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 19,
  },
  integrationCardButton: {
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D8DAF2",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#F6F7FF",
  },
  integrationCardButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },

  // Profile screen
  profileScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  profileContent: {
    paddingBottom: 40,
  },
  profileHero: {
    paddingHorizontal: 24,
    paddingTop: 76,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  profileHeroHeading: {
    color: COLORS.surface,
    fontSize: 26,
    fontWeight: "700",
  },
  profileHeroLabel: {
    marginTop: 12,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "600",
  },
  profileHeroEmail: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },
  profileSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  profileSectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  profileOption: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  profileOptionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  profileOptionDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  profileLogoutButton: {
    marginTop: 36,
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,77,79,0.25)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFF5F5",
  },
  profileLogoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.danger,
  },
});

export { COLORS };
export default GlobalStyles;
