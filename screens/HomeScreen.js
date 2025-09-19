import { View, Text, TouchableOpacity, Image } from "react-native";
import styles from "../styles/homeScreenStyle";

// Hjemmeskærmen med en knap til at oprette en ny annonce
export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/lently-logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>Welcome to Lently</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("CreateListing", { listings: [] })}
      >
        <Text style={styles.buttonText}>
          Opret din første annonce lige her!
        </Text>
      </TouchableOpacity>
    </View>
  );
}
