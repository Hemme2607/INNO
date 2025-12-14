// Signup-komponent der håndterer Clerk-registrering og visning.
import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";


// Funktion til at kunne oprette bruger i systemet med Clerk
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startMicrosoftOAuth } = useOAuth({
    strategy: "oauth_microsoft",
  });

  // Opretter konto via e-mail/password med basic validering
  const handleSignup = async () => {
    if (!isLoaded) {
      Alert.alert("Vent venligst", "Clerk er ikke klar endnu");
      return;
    }

    // Validering
    if (!email.trim()) {
      Alert.alert("Fejl", "Email er påkrævet");
      return;
    }
    if (!password || password.length < 8) {
      Alert.alert("Fejl", "Adgangskode skal være mindst 8 tegn");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Fejl", "Navn er påkrævet");
      return;
    }

    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        password: password,
        firstName: name.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Alert.alert("Konto oprettet", "Velkommen til Lently!");
      } else if (result.status === "missing_requirements") {
        // Hvis der mangler verificering
        Alert.alert("Verificering påkrævet", "Tjek din email for verificeringslink");
      }
    } catch (error) {
      const errorMessage = error.errors?.[0]?.message || error.message || "Ukendt fejl";
      Alert.alert("Noget gik galt", errorMessage);
    }
  };

  // Starter OAuth-signup for en given udbyder
  const handleOAuthSignup = async (providerLabel, startOAuth) => {
    try {
      const { createdSessionId, setActive: setOAuthActive } = await startOAuth();

      if (createdSessionId && setOAuthActive) {
        await setOAuthActive({ session: createdSessionId });
        Alert.alert("Velkommen!", `Din konto er oprettet med ${providerLabel}`);
      }
    } catch (error) {
      const message = error.errors?.[0]?.message || error.message || "Ukendt fejl";
      Alert.alert(`${providerLabel} signup fejlede`, message);
    }
  };

  // Opstætning og reference til styling for signup komponent fra GlobalStyles
  return (
    <View>
      <View style={GlobalStyles.cardHeader}>
        <Text style={GlobalStyles.heading}>Kom i gang gratis</Text>
      </View>

      <View style={GlobalStyles.inputGroup}>
        <Text style={GlobalStyles.label}>Navn</Text>
        <TextInput
          placeholder="Dit fulde navn"
          placeholderTextColor="rgba(228, 234, 255, 0.4)"
          style={GlobalStyles.input}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={GlobalStyles.inputGroup}>
        <Text style={GlobalStyles.label}>Email adresse</Text>
        <TextInput
          placeholder="navn@email.com"
          placeholderTextColor="rgba(228, 234, 255, 0.4)"
          style={GlobalStyles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>

      <View style={GlobalStyles.inputGroup}>
        <Text style={GlobalStyles.label}>Adgangskode</Text>
        <TextInput
          placeholder="Min. 8 tegn"
          placeholderTextColor="rgba(228, 234, 255, 0.4)"
          style={GlobalStyles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={GlobalStyles.button} onPress={handleSignup}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={GlobalStyles.buttonGradient}
        >
          <Text style={GlobalStyles.buttonText}>Opret konto</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={GlobalStyles.divider}>
        <View style={GlobalStyles.dividerLine} />
        <Text style={GlobalStyles.dividerText}>eller fortsæt med</Text>
        <View style={GlobalStyles.dividerLine} />
      </View>

      <View style={GlobalStyles.socialStack}>
        <TouchableOpacity
          style={GlobalStyles.socialButtonFull}
          onPress={() => handleOAuthSignup("Google", startGoogleOAuth)}
        >
          <View style={GlobalStyles.socialButtonContent}>
            <View style={GlobalStyles.socialIconBadge}>
              <Image
                source={require("../../../assets/google-logo.png")}
                style={GlobalStyles.socialIconImage}
              />
            </View>
            <Text style={GlobalStyles.socialButtonLabel}>Opret med Google</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={GlobalStyles.socialButtonFull}
          onPress={() => handleOAuthSignup("Microsoft", startMicrosoftOAuth)}
        >
          <View style={GlobalStyles.socialButtonContent}>
            <View style={GlobalStyles.socialIconBadge}>
              <Image
                source={require("../../../assets/Microsoft-logo.png")}
                style={GlobalStyles.socialIconImage}
              />
            </View>
            <Text style={GlobalStyles.socialButtonLabel}>
              Opret med Microsoft
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
