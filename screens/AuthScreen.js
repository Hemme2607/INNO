import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Login from "../components/LoginComponent";
import Signup from "../components/SignUpComponent";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

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
          <Text style={[GlobalStyles.homeHeroText, { textAlign: "center" }]}>
            Lently
          </Text>
          <Text style={[GlobalStyles.subheading, { color: "#E5E6FF" }]}>
            Del, lån og oplev mere sammen
          </Text>
        </View>

        <View style={GlobalStyles.card}>
          {isLogin ? <Login /> : <Signup />}

          <View style={{ marginTop: 28, alignItems: "center" }}>
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>
              {isLogin ? "Har du ikke en konto?" : "Har du allerede en konto?"}
            </Text>
            <TouchableOpacity
              onPress={() => setIsLogin((prev) => !prev)}
              style={{ marginTop: 6 }}
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
