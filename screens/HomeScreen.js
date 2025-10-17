import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";
import { auth } from "../database/database";

export default function HomeScreen({ navigation }) {
  const userEmail = auth.currentUser?.email ?? "ven";
  const displayName = userEmail.split("@")[0] || "ven";

  const handleGoToInbox = () => {
    navigation.navigate("Inbox");
  };

  const handleConnectIntegration = () => {
    navigation.navigate("Integrations");
  };

  const handleOpenProfile = () => {
    navigation.navigate("Profile");
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hej {displayName} 👋</Text>
        <Text style={styles.subheading}>
          Velkommen til Sona. Her hjælper vi dig med at automatisere
          kundeservicebeskeder og klargøre svar, før du trykker send.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Indbakke</Text>
        <Text style={styles.cardDescription}>
          Holder styr på indkommende mails og AI-kladder, så du kan godkende dem
          på få sekunder.
        </Text>
        <TouchableOpacity style={styles.cardButton} onPress={handleGoToInbox}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardButtonGradient}
          >
            <Text style={styles.cardButtonText}>Gå til indbakke</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Integrationer</Text>
        <Text style={styles.cardDescription}>
          Forbind Shopify eller mail så Sona får adgang din data.
        </Text>
        <TouchableOpacity
          style={styles.cardButton}
          onPress={handleConnectIntegration}
        >
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardButtonGradient}
          >
            <Text style={styles.cardButtonText}>Tilføj integrationer</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Profil og indstillinger</Text>
        <Text style={styles.cardDescription}>
          Opdater kontaktoplysninger, administrer teamadgang og
          sikkerhedsindstillinger
        </Text>
        <TouchableOpacity style={styles.cardButton} onPress={handleOpenProfile}>
          <LinearGradient
            colors={[COLORS.primary, COLORS.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardButtonGradient}
          >
            <Text style={styles.cardButtonText}>Gå til profil</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: 24,
    paddingTop: 72,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  greeting: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  subheading: {
    fontSize: 15,
    color: COLORS.muted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 18,
    shadowColor: "#2D1B69",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
    gap: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.text,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 20,
  },
  cardButton: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardButtonGradient: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  cardButtonText: {
    color: COLORS.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});
