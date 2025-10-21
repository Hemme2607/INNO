import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { useDisplayName } from "../lib/useDisplayName";


// Profilskærm-komponenten med brugeroplysninger og logout-funktionalitet
export default function ProfileScreen() {
  const { signOut } = useAuth();
  const displayName = useDisplayName();

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      // Logout fejlede - stille fejl
    }
  };

  // Opbygning af ProfileScreen-komponenten
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={GlobalStyles.profileScreen}
    >
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={GlobalStyles.profileContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={GlobalStyles.profileHero}
      >
        <Text style={GlobalStyles.profileHeroHeading}>Din profil</Text>
        <Text style={GlobalStyles.profileHeroLabel}>Logget ind som</Text>
        <Text style={GlobalStyles.profileHeroEmail}>{displayName}</Text>
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
    </LinearGradient>
  );
}
