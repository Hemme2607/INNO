import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../database/database";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

// Login funktion til at logge ind med Firebase
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Velkommen tilbage!");
    } catch (error) {
      Alert.alert("Login fejlede", error.message);
    }
  };

  // Opstætning og reference til styling for login komponent fra GlobalStyles
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
        <TouchableOpacity style={GlobalStyles.socialButton}>
          <Text style={GlobalStyles.socialButtonText}>Google</Text>
        </TouchableOpacity>
        <TouchableOpacity style={GlobalStyles.socialButton}>
          <Text style={GlobalStyles.socialButtonText}>Facebook</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
