import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { onAuthStateChanged } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import HomeScreen from "./screens/HomeScreen";
import AuthScreen from "./screens/AuthScreen";
import { auth } from "./database/database";
import InboxScreen from "./screens/InboxScreen";
import IntegrationsScreen from "./screens/IntegrationsScreen";
import ProfileScreen from "./screens/ProfileScreen";

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



export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);

      if (initializing) {
        setInitializing(false);
      }
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {user ? (
            <Stack.Screen name="Main" component={MainTabs} />
          ) : (
            <Stack.Screen name="Auth" component={AuthScreen} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
