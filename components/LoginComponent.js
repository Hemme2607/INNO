import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import { GoogleAuthProvider, signInWithCredential, signInWithEmailAndPassword } from "firebase/auth";
import { useIdTokenAuthRequest } from "expo-auth-session/providers/google";
import { auth } from "../database/database";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [request, response, promptAsync] = useIdTokenAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Velkommen tilbage!");
    } catch (error) {
      Alert.alert("Login fejlede", error.message);
    }
  };

  useEffect(() => {
    const authenticateWithFirebase = async () => {
      if (response?.type !== "success") {
        return;
      }

      try {
        const idToken = response.params.id_token;
        if (!idToken) {
          throw new Error("Google returnerede ingen ID-token");
        }

        const credential = GoogleAuthProvider.credential(idToken);
        await signInWithCredential(auth, credential);
        Alert.alert("Logget ind med Google");
      } catch (error) {
        Alert.alert(
          "Google login fejlede",
          error?.message ?? "Kunne ikke logge ind med Google"
        );
      }
    };

    authenticateWithFirebase();
  }, [response]);

  const handleGoogleLogin = async () => {
    try {
      if (!process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID && !process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID) {
        Alert.alert(
          "Google login er ikke konfigureret",
          "Tilføj dine Google client IDs i .env.local og genstart appen."
        );
        return;
      }

      await promptAsync();
    } catch (error) {
      Alert.alert(
        "Google login fejlede",
        error?.message ?? "Kunne ikke åbne Google login"
      );
    }
  };

  return (
    <View>
      <View style={GlobalStyles.cardHeader}>
        <Text style={GlobalStyles.heading}>Velkommen tilbage</Text>
        <Text style={GlobalStyles.subheading}>
          Indtast dine oplysninger for at logge ind
        </Text>
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
          placeholder="********"
          placeholderTextColor="#A2A4C3"
          style={GlobalStyles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity style={GlobalStyles.button} onPress={handleLogin}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
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

      <View style={GlobalStyles.socialRow}>
        <TouchableOpacity
          style={GlobalStyles.socialButton}
          onPress={handleGoogleLogin}
          disabled={!request}
        >
          <Text style={GlobalStyles.socialButtonText}>Google</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
