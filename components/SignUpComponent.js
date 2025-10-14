import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../database/database";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleSignup = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Konto oprettet", "Velkommen til Lently!");
    } catch (error) {
      Alert.alert("Noget gik galt", error.message);
    }
  };

  return (
    <View>
      <View style={GlobalStyles.cardHeader}>
        <Text style={GlobalStyles.heading}>Kom i gang gratis</Text>
        <Text style={GlobalStyles.subheading}>
          Opret en konto og udforsk Lently-universet
        </Text>
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
