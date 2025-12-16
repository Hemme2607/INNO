// Home-skærm med hurtige CTA'er til indbakke, integrationer og profil.
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { useDisplayName } from "../lib/hooks/useDisplayName";


// HomeScreen-komponenten
export default function HomeScreen({ navigation }) {
  const displayName = useDisplayName();

  // Navigationsgenveje til bundfanerne
  // Åbner indbakke-fanen så brugeren kan se mails
  const handleGoToInbox = () => {
    navigation.navigate("Inbox");
  };

  // Sender brugeren til integrationsskærmen
  const handleConnectIntegration = () => {
    navigation.navigate("Integrations");
  };

  // Viser profil- og indstillingssiden
  const handleOpenProfile = () => {
    navigation.navigate("Profile");
  };

  // Opbygning af HomeScreen-komponenten og GlobalStyles anvendelse
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={GlobalStyles.homeScreenContainer}
    >
      <View style={GlobalStyles.homeScreenHeader}>
        <Text style={GlobalStyles.homeScreenGreeting}>Hej {displayName} 👋</Text>
        <Text style={GlobalStyles.homeScreenIntro}>
          Velkommen til Sona. Her hjælper vi dig med at automatisere
          kundeservicebeskeder og klargøre svar, før du trykker send.
        </Text>
      </View>

      <View style={GlobalStyles.homeScreenCard}>
        <Text style={GlobalStyles.homeScreenCardTitle}>Indbakke</Text>
        <Text style={GlobalStyles.homeScreenCardDescription}>
          Holder styr på indkommende mails og AI-kladder, så du kan godkende dem
          på få sekunder.
        </Text>
        <TouchableOpacity
          style={GlobalStyles.homeScreenCardButton}
          onPress={handleGoToInbox}
        >
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={GlobalStyles.homeScreenCardButtonGradient}
          >
            <Text style={GlobalStyles.homeScreenCardButtonText}>
              Gå til indbakke
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={GlobalStyles.homeScreenCard}>
        <Text style={GlobalStyles.homeScreenCardTitle}>Integrationer</Text>
        <Text style={GlobalStyles.homeScreenCardDescription}>
          Forbind Shopify eller mail så Sona får adgang din data.
        </Text>
        <TouchableOpacity
          style={GlobalStyles.homeScreenCardButton}
          onPress={handleConnectIntegration}
        >
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={GlobalStyles.homeScreenCardButtonGradient}
          >
            <Text style={GlobalStyles.homeScreenCardButtonText}>
              Tilføj integrationer
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={GlobalStyles.homeScreenCard}>
        <Text style={GlobalStyles.homeScreenCardTitle}>
          Profil og indstillinger
        </Text>
        <Text style={GlobalStyles.homeScreenCardDescription}>
          Opdater kontaktoplysninger, administrer teamadgang og
          sikkerhedsindstillinger
        </Text>
        <TouchableOpacity
          style={GlobalStyles.homeScreenCardButton}
          onPress={handleOpenProfile}
        >
          <LinearGradient
            colors={[COLORS.primaryDark, COLORS.primary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={GlobalStyles.homeScreenCardButtonGradient}
          >
            <Text style={GlobalStyles.homeScreenCardButtonText}>
              Gå til profil
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}
