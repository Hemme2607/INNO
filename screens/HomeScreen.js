import { View, Text, TouchableOpacity, Image } from "react-native";
import GlobalStyles from "../styles/GlobalStyles";

// Hjemmeskærmen med en knap til at oprette en ny annonce
export default function HomeScreen({ navigation }) {
  return (
    <View style={GlobalStyles.homeContainer}>
      <Image
        source={require("../assets/lently-logo.png")}
        style={GlobalStyles.logo}
      />
      <Text style={GlobalStyles.title}>Welcome to Lently</Text>
      <TouchableOpacity
        style={GlobalStyles.buttonSecondary}
        onPress={() => navigation.navigate("CreateListing", { listings: [] })}
      >
        <Text style={GlobalStyles.buttonSecondaryText}>
          Opret din første annonce lige her!
        </Text>
      </TouchableOpacity>
    </View>
  );
}
