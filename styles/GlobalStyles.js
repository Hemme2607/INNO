import { StyleSheet } from "react-native";

const COLORS = {
  primary: "#4D7CFF",
  primaryDark: "#315CFF",
  secondary: "#6A4CFF",
  surface: "#1B2233",
  surfaceAlt: "#151C2B",
  background: "#0B1220",
  text: "#E4EAFF",
  muted: "#7D8AAD",
  success: "#2ED6A3",
  danger: "#FF5B6B",
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
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
  },
  authScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 56,
    width: "100%",
    alignItems: "center",
  },

  // Cards
  card: {
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 28,
    paddingVertical: 30,
    paddingHorizontal: 24,
    shadowColor: "#05070F",
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
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
  inputGroup: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "rgba(125, 138, 173, 0.3)",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 15,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
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
    color: COLORS.text,
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
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(125, 138, 173, 0.28)",
  },
  dividerText: {
    marginHorizontal: 12,
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: "600",
  },

  // Social buttons
  socialStack: {
    width: "100%",
    gap: 14,
  },
  socialButtonFull: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(125, 138, 173, 0.28)",
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    overflow: "hidden",
  },
  socialButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  socialIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
  },
  socialIconImage: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  socialButtonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },

  // Auth screen helpers
  authBrandTitle: {
    color: COLORS.text,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
  },
  authBrandSubtitle: {
    color: "rgba(228, 234, 255, 0.7)",
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
    paddingBottom: 40,
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
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.1)",
    shadowColor: "#05070F",
    shadowOpacity: 0.4,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 20 },
    elevation: 8,
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
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },

  // Inbox screen
  inboxScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inboxTopDivider: {
    height: 12,
    backgroundColor: COLORS.background,
  },
  inboxHeader: {
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 20,
    backgroundColor: COLORS.surfaceAlt,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(77, 124, 255, 0.12)",
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
    backgroundColor: "rgba(77, 124, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  inboxListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
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
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.08)",
    shadowColor: "#05070F",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.08)",
    shadowColor: "#05070F",
    shadowOpacity: 0.35,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 7,
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
    backgroundColor: "rgba(77, 124, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  integrationIconImage: {
    width: 24,
    height: 24,
    resizeMode: "cover",
  },
  integrationIconImageLarge: {
    width: 36,
    height: 36,
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
    borderColor: "rgba(77, 124, 255, 0.35)",
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "rgba(77, 124, 255, 0.16)",
  },
  integrationCardButtonLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  integrationCardStatus: {
    marginTop: 12,
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
  },
  integrationModalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5, 7, 15, 0.78)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  integrationModalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: COLORS.surface,
    borderRadius: 26,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.16)",
    shadowColor: "#05070F",
    shadowOpacity: 0.45,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 22 },
  },
  integrationModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
  },
  integrationModalDescription: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  integrationModalField: {
    gap: 6,
  },
  integrationModalLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.muted,
  },
  integrationModalInput: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(125, 138, 173, 0.45)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: COLORS.text,
    backgroundColor: COLORS.surfaceAlt,
    fontSize: 14,
  },
  integrationModalHint: {
    fontSize: 12,
    color: COLORS.muted,
  },
  integrationModalError: {
    fontSize: 13,
    color: COLORS.danger,
  },
  integrationModalLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  integrationModalActions: {
    flexDirection: "row",
    gap: 12,
  },
  integrationModalPrimary: {
    flex: 1,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    paddingVertical: 14,
  },
  integrationModalPrimaryLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "700",
  },
  integrationModalGhost: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(125, 138, 173, 0.4)",
    alignItems: "center",
    paddingVertical: 14,
  },
  integrationModalGhostLabel: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: "600",
  },
  integrationModalDisconnect: {
    marginTop: 4,
    alignItems: "center",
  },
  integrationModalDisconnectLabel: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: "600",
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
    color: COLORS.text,
    fontSize: 26,
    fontWeight: "700",
  },
  profileHeroLabel: {
    marginTop: 12,
    color: "rgba(228,234,255,0.72)",
    fontSize: 13,
    fontWeight: "600",
  },
  profileHeroEmail: {
    color: COLORS.text,
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
    backgroundColor: COLORS.surfaceAlt,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.08)",
    shadowColor: "#05070F",
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 16 },
    elevation: 6,
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
    borderColor: "rgba(255, 91, 107, 0.35)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "rgba(255, 91, 107, 0.14)",
  },
  profileLogoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.danger,
  },
});

export { COLORS };
export default GlobalStyles;
