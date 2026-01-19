// Skærm for brugerprofil og generelle indstillinger.
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { useDisplayName } from "../lib/hooks/useDisplayName";


// Profilskærm-komponenten med brugeroplysninger og logout-funktionalitet
export default function ProfileScreen() {
  // Clerk hook til logout
  const { signOut } = useAuth();
  // Hent venligt visningsnavn
  const displayName = useDisplayName();

  // Logger brugeren ud via Clerk og ignorerer stille fejl
  const handleLogout = async () => {
    try {
      // Udfør logout-kaldet
      await signOut();
    } catch (error) {
      // Ignorer fejl for at undgå at blokere UI
    }
  };

  // Opbygning af ProfileScreen-komponenten
  return (
    <LinearGradient
      // Baggrundsgradient for hele skærmen
      colors={[COLORS.background, COLORS.surfaceAlt]}
      // Start og slut for gradient
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      // Container-stil
      style={GlobalStyles.profileScreen}
    >
    <ScrollView
      // Fyld pladsen
      style={{ flex: 1 }}
      // Indholdsstil med padding
      contentContainerStyle={GlobalStyles.profileContent}
      // Skjul scrollbar
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        // Hero-område med stærkere farver
        colors={[COLORS.primaryDark, COLORS.primary]}
        // Retning for gradient i hero
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        // Hero-stil
        style={GlobalStyles.profileHero}
      >
        {/* Overskrift for profilsektionen */}
        <Text style={GlobalStyles.profileHeroHeading}>Din profil</Text>
        {/* Label for hvem der er logget ind */}
        <Text style={GlobalStyles.profileHeroLabel}>Logget ind som</Text>
        {/* Visningsnavn fra hook */}
        <Text style={GlobalStyles.profileHeroEmail}>{displayName}</Text>
      </LinearGradient>

      <View style={GlobalStyles.profileSection}>
        {/* Titel for konto-sektionen */}
        <Text style={GlobalStyles.profileSectionTitle}>Konto</Text>
        <TouchableOpacity style={GlobalStyles.profileOption}>
          {/* Placeholder for kontaktoplysninger */}
          <Text style={GlobalStyles.profileOptionLabel}>Kontaktoplysninger</Text>
          <Text style={GlobalStyles.profileOptionDescription}>
            Opdater navn, e-mail og telefon, så teamet ved hvem de svarer som.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={GlobalStyles.profileOption}>
          {/* Placeholder for sikkerhedsindstillinger */}
          <Text style={GlobalStyles.profileOptionLabel}>Sikkerhed</Text>
          <Text style={GlobalStyles.profileOptionDescription}>
            Skift adgangskode eller slå to-faktor godkendelse til.
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={GlobalStyles.profileOption}>
          {/* Placeholder for teamadgang */}
          <Text style={GlobalStyles.profileOptionLabel}>Teamadgang</Text>
          <Text style={GlobalStyles.profileOptionDescription}>
            Inviter kollegaer og administrer deres roller.
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        // Logout-knap nederst
        style={GlobalStyles.profileLogoutButton}
        // Handler til at logge ud
        onPress={handleLogout}
      >
        {/* Knap-tekst */}
        <Text style={GlobalStyles.profileLogoutText}>Log ud</Text>
      </TouchableOpacity>
    </ScrollView>
    </LinearGradient>
  );
}
