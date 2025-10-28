import React from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ClerkProvider, useAuth } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

import HomeScreen from "./screens/HomeScreen";
import AuthScreen from "./screens/AuthScreen";
import InboxScreen from "./screens/InboxScreen";
import IntegrationsScreen from "./screens/IntegrationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import AgentScreen from "./screens/AgentScreen";
import { CLERK_PUBLISHABLE_KEY, clerkConfig } from "./clerk-config";
import { COLORS } from "./styles/GlobalStyles";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// De forskellige tabs i applikation
function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabIcons = {
    Home: "home-outline",
    Inbox: "mail-outline",
    Integrations: "share-social-outline",
    Profile: "person-circle-outline",
  };
// Styling til naviation bar
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneContainerStyle: { backgroundColor: COLORS.background },
        tabBarStyle: {
          height: 60 + Math.max(insets.bottom - 6, 0),
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom ? insets.bottom - 6 : 10, 10),
          backgroundColor: COLORS.surfaceAlt,
          borderTopWidth: 0,
          elevation: 0,
        },
        safeAreaInsets: { bottom: 0 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.muted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: "Hjem",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.Home} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Inbox"
        component={InboxScreen}
        options={{
          tabBarLabel: "Indbakke",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.Inbox} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Agent"
        component={AgentScreen}
        options={{
          tabBarLabel: "Agent",
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="robot-happy-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Integrations"
        component={IntegrationsScreen}
        options={{
          tabBarLabel: "Integrationer",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.Integrations} size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name={tabIcons.Profile} size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}



// Komponent der håndterer authentication state
function AppContent() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: COLORS.background,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const navigationTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: COLORS.background,
      card: COLORS.surfaceAlt,
      text: COLORS.text,
      border: "rgba(77, 124, 255, 0.12)",
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        {isSignedIn ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  if (!CLERK_PUBLISHABLE_KEY) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 16, textAlign: 'center', marginBottom: 20 }}>
          Error: Clerk Publishable Key not found.
        </Text>
        <Text style={{ fontSize: 14, textAlign: 'center', color: '#666' }}>
          Check your .env file and make sure EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY is set.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider {...clerkConfig}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ClerkProvider>
  );
}
