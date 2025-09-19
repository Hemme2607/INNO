import { StyleSheet } from "react-native";

// Nedenfor ses styling til hjemskærmen
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  // Styler logoet så det passer pænt ind på skærmen, ellers ville det have været udover hele skærmen
  logo: { width: 200, height: 200, marginBottom: 0, resizeMode: "contain" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "600" },
});

// Eksporterer stilen, så den kan bruges i HomeScreen.js
export default styles;
