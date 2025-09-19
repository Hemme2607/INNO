import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    width: "90%",
    marginBottom: 20,
  },
  infoBox: {
    backgroundColor: "#eee",
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
    width: "100%",
  },
  title: { fontSize: 20, fontWeight: "bold" },
  price: { fontSize: 16, color: "green" },
  description: { fontSize: 16, color: "#444" },
  category: { fontSize: 14, color: "#555" },
  button: {
    backgroundColor: "#2196F3",
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});

// Eksporterer stilen, så den kan bruges i ListingDetailScreen.js
export default styles;
