import React from "react";
import { ActivityIndicator, View, Text } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { ClerkProvider, useAuth, useUser } from "@clerk/clerk-expo";
import * as SecureStore from "expo-secure-store";

import HomeScreen from "./screens/HomeScreen";
import AuthScreen from "./screens/AuthScreen";
import InboxScreen from "./screens/InboxScreen";
import IntegrationsScreen from "./screens/IntegrationsScreen";
import ProfileScreen from "./screens/ProfileScreen";
import { CLERK_PUBLISHABLE_KEY, clerkConfig } from "./clerk-config";

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
        tabBarStyle: {
          height: 54 + Math.max(insets.bottom - 8, 6),
          paddingTop: 4,
          paddingBottom: Math.max(insets.bottom - 8, 6),
        },
        safeAreaInsets: { bottom: 0 },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarActiveTintColor: "#5B3DF6",
        tabBarInactiveTintColor: "#6E7191",
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
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
