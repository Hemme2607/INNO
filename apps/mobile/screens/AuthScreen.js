// Skærm der viser login- og signup-flowet styret af Clerk.
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Login from "../components/LoginComponent";
import Signup from "../components/SignUpComponent";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";


/**
 * Viser en gradientbaggrund med app-navn og skifter mellem Login- og Signup-formularer baseret på intern `isLogin`-state.
 */
export default function AuthScreen() {
  // Holder styr på om login- eller signup-formularen skal vises
  const [isLogin, setIsLogin] = useState(true);

  return (
    <LinearGradient
      // Baggrundsfarver til skærmen
      colors={[COLORS.surfaceAlt, COLORS.background]}
      // Retning for gradienten
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      // Genbrug globale styles
      style={GlobalStyles.authBackground}
    >
      <KeyboardAvoidingView
        // iOS skal skubbe indhold op ved tastatur
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        // Samme baggrundsstil som udenfor
        style={GlobalStyles.authBackground}
      >
        <ScrollView
          // Plads og centrering for indholdet
          contentContainerStyle={GlobalStyles.authScrollContent}
          // Lukker tastatur ved klik på indhold
          keyboardShouldPersistTaps="handled"
          // Ingen bounce-effekt
          bounces={false}
          // Skjuler scrollbar for renere layout
          showsVerticalScrollIndicator={false}
        >
          <View style={GlobalStyles.authWrapper}>
            {/* Wrapper til kortet med login/signup */}

            <View style={GlobalStyles.card}>
              {/* Viser login eller signup baseret på state */}
              {isLogin ? <Login /> : <Signup />}

              <View style={GlobalStyles.authToggleContainer}>
                {/* Forklarende tekst under formularen */}
                <Text style={GlobalStyles.authToggleCopy}>
                  {isLogin ? "Har du ikke en konto?" : "Har du allerede en konto?"}
                </Text>
                <TouchableOpacity
                  // Skifter mellem login og signup
                  onPress={() => setIsLogin((prev) => !prev)}
                  // Link-stil for skift
                  style={GlobalStyles.authToggleLink}
                >
                  <Text style={GlobalStyles.linkText}>
                    {isLogin ? "Opret dig gratis" : "Log ind"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}
