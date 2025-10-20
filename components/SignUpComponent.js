import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignUp, useOAuth } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";


// Funktion til at kunne oprette bruger i systemet med Clerk
export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const { signUp, setActive, isLoaded } = useSignUp();
  const { startOAuthFlow } = useOAuth({ strategy: "oauth_google" });

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

  const handleGoogleSignup = async () => {
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();
      
      if (createdSessionId) {
        await setActive({ session: createdSessionId });
        Alert.alert("Velkommen!", "Din konto er oprettet med Google");
      }
    } catch (error) {
      Alert.alert("Google signup fejlede", error.message || "Ukendt fejl");
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
          placeholderTextColor="#A2A4C3"
          style={GlobalStyles.input}
          value={name}
          onChangeText={setName}
        />
      </View>

      <View style={GlobalStyles.inputGroup}>
        <Text style={GlobalStyles.label}>Email adresse</Text>
        <TextInput
          placeholder="navn@email.com"
          placeholderTextColor="#A2A4C3"
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
          placeholderTextColor="#A2A4C3"
          style={GlobalStyles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={GlobalStyles.button} onPress={handleSignup}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
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

      <View style={GlobalStyles.socialRow}>
        <TouchableOpacity style={GlobalStyles.socialButton} onPress={handleGoogleSignup}>
          <Text style={GlobalStyles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={GlobalStyles.socialButton}>
          <Text style={GlobalStyles.socialButtonText}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
