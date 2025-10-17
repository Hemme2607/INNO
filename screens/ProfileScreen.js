import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { auth } from "../database/database";

export default function ProfileScreen() {
  const email = auth.currentUser?.email ?? "ukendt bruger";

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout fejlede:", error.message);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroHeading}>Din profil</Text>
        <Text style={styles.heroLabel}>Logget ind som</Text>
        <Text style={styles.heroEmail}>{email}</Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Konto</Text>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionLabel}>Kontaktoplysninger</Text>
          <Text style={styles.optionDescription}>
            Opdater navn, e-mail og telefon, så teamet ved hvem de svarer som.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionLabel}>Sikkerhed</Text>
          <Text style={styles.optionDescription}>
            Skift adgangskode eller slå to-faktor godkendelse til.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.option}>
          <Text style={styles.optionLabel}>Teamadgang</Text>
          <Text style={styles.optionDescription}>
            Inviter kollegaer og administrer deres roller.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log ud</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 76,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  heroHeading: {
    color: COLORS.surface,
    fontSize: 26,
    fontWeight: "700",
  },
  heroLabel: {
    marginTop: 12,
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    fontWeight: "600",
  },
  heroEmail: {
    color: COLORS.surface,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 6,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 28,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  option: {
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    padding: 18,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 5,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  optionDescription: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 6,
    lineHeight: 19,
  },
  logoutButton: {
    marginTop: 36,
    marginHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,77,79,0.25)",
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#FFF5F5",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.danger,
  },
});
