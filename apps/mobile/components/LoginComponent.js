// Login-komponent der bruger Clerk og tilbyder e-mail eller OAuth.
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSignIn, useOAuth } from "@clerk/clerk-expo";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

// Login funktion til at logge ind med Clerk
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, setActive: setActiveSession, isLoaded } = useSignIn();
  const { startOAuthFlow: startGoogleOAuth } = useOAuth({
    strategy: "oauth_google",
  });
  const { startOAuthFlow: startMicrosoftOAuth } = useOAuth({
    strategy: "oauth_microsoft",
  });

  // Logger ind med e-mail/password via Clerk
  const handleLogin = async () => {
    if (!isLoaded) return;

    try {
      const result = await signIn.create({
        identifier: email.trim(),
        password: password,
      });

      if (result.status === "complete") {
        await setActiveSession({ session: result.createdSessionId });
        Alert.alert("Velkommen tilbage!");
      }
    } catch (error) {
      Alert.alert("Login fejlede", error.errors?.[0]?.message || error.message);
    }
  };

  // Starter OAuth-flow for valgt udbyder (Google/Microsoft)
  const handleOAuthLogin = async (providerLabel, startOAuth) => {
    try {
      const { createdSessionId, setActive } = await startOAuth();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
        Alert.alert("Velkommen!", `Du er nu logget ind med ${providerLabel}`);
      }
    } catch (error) {
      const message = error.errors?.[0]?.message || error.message || "Ukendt fejl";
      Alert.alert(`${providerLabel} login fejlede`, message);
    }
  };

  // Opstætning og reference til styling for login komponent fra GlobalStyles
  return (
    <View>
      <View style={GlobalStyles.cardHeader}>
        <Text style={GlobalStyles.heading}>Velkommen</Text>
        <Text style={GlobalStyles.subheading}>
          Indtast dine oplysninger for at logge ind
        </Text>
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
          placeholder="********"
          placeholderTextColor="rgba(228, 234, 255, 0.4)"
          style={GlobalStyles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={GlobalStyles.button} onPress={handleLogin}>
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={GlobalStyles.buttonGradient}
        >
          <Text style={GlobalStyles.buttonText}>Log ind</Text>
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity style={GlobalStyles.ghostButton}>
        <Text style={GlobalStyles.ghostButtonText}>Glemt adgangskode?</Text>
      </TouchableOpacity>

      <View style={GlobalStyles.divider}>
        <View style={GlobalStyles.dividerLine} />
        <Text style={GlobalStyles.dividerText}>eller fortsæt med</Text>
        <View style={GlobalStyles.dividerLine} />
      </View>

      <View style={GlobalStyles.socialStack}>
        <TouchableOpacity
          style={GlobalStyles.socialButtonFull}
          onPress={() => handleOAuthLogin("Google", startGoogleOAuth)}
        >
          <View style={GlobalStyles.socialButtonContent}>
            <View style={GlobalStyles.socialIconBadge}>
              <Image
                source={require("../../../assets/google-logo.png")}
                style={GlobalStyles.socialIconImage}
              />
            </View>
            <Text style={GlobalStyles.socialButtonLabel}>Log ind med Google</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={GlobalStyles.socialButtonFull}
          onPress={() => handleOAuthLogin("Microsoft", startMicrosoftOAuth)}
        >
          <View style={GlobalStyles.socialButtonContent}>
            <View style={GlobalStyles.socialIconBadge}>
              <Image
                source={require("../../../assets/Microsoft-logo.png")}
                style={GlobalStyles.socialIconImage}
              />
            </View>
            <Text style={GlobalStyles.socialButtonLabel}>
              Log ind med Microsoft
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
