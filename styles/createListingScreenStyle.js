import { StyleSheet } from "react-native";

// Nedenfor ses styling til oprettelsesskærmen
// Forholdvis enkel style til skærmen når man skal oprette en annonce
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 20 },
  heading: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },
  button: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 0,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  categoryButton: {
    backgroundColor: "#eee",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    margin: 6,
    borderWidth: 1,
    borderColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    minWidth: 120,
    height: 50,
  },
  categoryButtonSelected: {
    backgroundColor: "#2196F3",
    borderColor: "#1976D2",
  },
  categoryButtonText: {
    fontSize: 14,
    color: "#333",
  },
  categoryButtonTextSelected: {
    color: "#fff",
    fontWeight: "bold",
  },
});

// Eksporterer stilen, så den kan bruges i CreateListingScreen.js
export default styles;
