import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signOut } from "firebase/auth";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { auth } from "../database/database";

export default function HomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout fejlede:", error.message);
    }
  };

  const userEmail = auth.currentUser?.email ?? "ven";

  return (
    <View style={GlobalStyles.homeContainer}>
      <LinearGradient
        colors={[COLORS.primaryDark, COLORS.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={GlobalStyles.homeHero}
      >
        <Text style={GlobalStyles.homeHeroText}>Hej {userEmail} 👋</Text>
        <Text style={[GlobalStyles.subheading, { color: "#E5E6FF" }]}>
          Du er logget ind. Klar til at dele og opdage nyt udstyr.
        </Text>
      </LinearGradient>

      <View style={GlobalStyles.homeContent}>
        <View style={GlobalStyles.homeCard}>
          <Text style={GlobalStyles.homeTitle}>Opret din første annonce</Text>
          <Text style={GlobalStyles.homeSubtitle}>
            Tilføj dit gear og lad andre i fællesskabet få glæde af det.
          </Text>
          <View style={GlobalStyles.homeButtonRow}>
            <TouchableOpacity
              style={GlobalStyles.button}
              onPress={() =>
                navigation.navigate("CreateListing", { listings: [] })
              }
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={GlobalStyles.buttonGradient}
              >
                <Text style={GlobalStyles.buttonText}>Opret annonce</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                GlobalStyles.socialButton,
                { backgroundColor: "#FDECEF", borderColor: "transparent" },
              ]}
              onPress={handleLogout}
            >
              <Text
                style={[GlobalStyles.socialButtonText, { color: COLORS.danger }]}
              >
                Log ud
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}
