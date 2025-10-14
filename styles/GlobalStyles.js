import { StyleSheet } from "react-native";

const GlobalStyles = StyleSheet.create({
  //Fælles ting
  container: { flex: 1, backgroundColor: "#f9f9f9", padding: 20 },
  heading: { fontSize: 26, fontWeight: "bold", marginBottom: 20 },
  label: { fontSize: 16, marginTop: 15, marginBottom: 5 },

  //Inputs
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#fff",
  },

  //Primære/sekundære knapper
  buttonPrimary: {
    backgroundColor: "#4CAF50",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonPrimaryText: { color: "#fff", fontSize: 18, fontWeight: "bold" },

  buttonSecondary: {
    backgroundColor: "#2196F3",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonSecondaryText: { color: "#fff", fontSize: 18, fontWeight: "600" },

  // Styler Kategoriknapper
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
  categoryList: {
    justifyContent: "center",
    paddingVertical: 10,
  },

  // Styler Home screen
  homeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  logo: { width: 200, height: 200, resizeMode: "contain" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 10 },

  // Styler Listing detail screen
  detailContainer: {
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
  detailTitle: { fontSize: 20, fontWeight: "bold" },
  price: { fontSize: 16, color: "green" },
  description: { fontSize: 16, color: "#444" },
  category: { fontSize: 14, color: "#555" },

  // Styler Edit detail screen
  editSaveButton: {
    marginTop: 20,
  },
  editEmptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  editEmptyText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
  },
});

// Eksporterer stilen, så den kan bruges i andre filer
export default GlobalStyles;
