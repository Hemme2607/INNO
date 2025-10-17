import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Login from "../components/LoginComponent";
import Signup from "../components/SignUpComponent";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";


/**
 * Viser en gradientbaggrund med app-navn og skifter mellem Login- og Signup-formularer baseret på intern `isLogin`-state.
 */
export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <LinearGradient
      colors={[COLORS.primaryDark, COLORS.secondary]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={GlobalStyles.authBackground}
    >
      <View style={GlobalStyles.authWrapper}>
        <View style={GlobalStyles.cardHeader}>
          <Text style={GlobalStyles.authBrandTitle}>Sona</Text>
          <Text style={GlobalStyles.authBrandSubtitle}>
            Optimer din kundeservice med AI-drevne svar
          </Text>
        </View>

        <View style={GlobalStyles.card}>
          {isLogin ? <Login /> : <Signup />}

          <View style={GlobalStyles.authToggleContainer}>
            <Text style={GlobalStyles.authToggleCopy}>
              {isLogin ? "Har du ikke en konto?" : "Har du allerede en konto?"}
            </Text>
            <TouchableOpacity
              onPress={() => setIsLogin((prev) => !prev)}
              style={GlobalStyles.authToggleLink}
            >
              <Text style={GlobalStyles.linkText}>
                {isLogin ? "Opret dig gratis" : "Log ind"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}
