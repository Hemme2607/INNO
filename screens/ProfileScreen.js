import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { auth } from "../database/database";


// Profilskærm-komponenten med brugeroplysninger og logout-funktionalitet
export default function ProfileScreen() {
  const email = auth.currentUser?.email ?? "ukendt bruger";

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout fejlede:", error.message);
    }
  };

  // Opbygning af ProfileScreen-komponenten
  return (
    <ScrollView
      style={GlobalStyles.profileScreen}
      contentContainerStyle={GlobalStyles.profileContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={GlobalStyles.profileHero}
      >
        <Text style={GlobalStyles.profileHeroHeading}>Din profil</Text>
        <Text style={GlobalStyles.profileHeroLabel}>Logget ind som</Text>
        <Text style={GlobalStyles.profileHeroEmail}>{email}</Text>
      </LinearGradient>

      <View style={GlobalStyles.profileSection}>
        <Text style={GlobalStyles.profileSectionTitle}>Konto</Text>
        <TouchableOpacity style={GlobalStyles.profileOption}>
          <Text style={GlobalStyles.profileOptionLabel}>Kontaktoplysninger</Text>
          <Text style={GlobalStyles.profileOptionDescription}>
            Opdater navn, e-mail og telefon, så teamet ved hvem de svarer som.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={GlobalStyles.profileOption}>
          <Text style={GlobalStyles.profileOptionLabel}>Sikkerhed</Text>
          <Text style={GlobalStyles.profileOptionDescription}>
            Skift adgangskode eller slå to-faktor godkendelse til.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={GlobalStyles.profileOption}>
          <Text style={GlobalStyles.profileOptionLabel}>Teamadgang</Text>
          <Text style={GlobalStyles.profileOptionDescription}>
            Inviter kollegaer og administrer deres roller.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={GlobalStyles.profileLogoutButton}
        onPress={handleLogout}
      >
        <Text style={GlobalStyles.profileLogoutText}>Log ud</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
