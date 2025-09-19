import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./screens/HomeScreen";
import CreateListingScreen from "./screens/CreateListingScreen";
import ListingDetailScreen from "./screens/ListingDetailScreen";

// Opretter en stack navigator, fordi vi skal navigere mellem forskellige skærme
const Stack = createNativeStackNavigator();

//Nu opretter jeg en navigation container, som indeholder vores stack navigator
//Jeg definerer også de forskellige skærme, som vi kan navigere til på appen men denne godkendelsesopgave udfolder ikke detailscreen.
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="CreateListing" component={CreateListingScreen} />
        <Stack.Screen name="ListingDetails" component={ListingDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
