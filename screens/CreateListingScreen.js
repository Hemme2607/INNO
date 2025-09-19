import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import styles from "../styles/createListingScreenStyle";

// Denne skærm bruges til at oprette en ny annonce (titel, pris og beskrivelse)
export default function CreateListingScreen({ navigation, route }) {
  const [title, setTitle] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState(null);
  const [price, setPrice] = React.useState("");
  const [description, setDescription] = React.useState("");

  const categories = [
    { id: "1", name: "Værktøj" },
    { id: "2", name: "Haveudstyr" },
    { id: "3", name: "Køkkenudstyr" },
    { id: "4", name: "Elektronik" },
  ];
  const handleSubmit = () => {
    // Muliggør at man skal kunne oprette en annonce
    const newItem = { title, price, description, category: selectedCategory };
    // Hvis vi allerede har annoncer, så brug dem, ellers start med en tom liste
    const listings = route.params?.listings || [];
    //Sender den til detailscreen og navigerer derhen
    navigation.navigate("ListingDetails", { listings: [...listings, newItem] });
  };

  // Nedenfor er UI til oprettelsesskærmen
  // Her er en simpel form for oprettelse, som giver en ide til hvordan det kan gøres
  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Opret annonce</Text>

      <Text style={styles.label}>Titel</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="F.eks. Plæneklipper"
      />

      <Text style={styles.label}>Pris (kr/dag)</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="F.eks. 100"
        keyboardType="numeric"
      />

      <Text style={styles.label}>Beskrivelse</Text>
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: "top" }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Skriv en kort beskrivelse..."
        multiline
      />

      <Text style={styles.label}>Vælg kategori</Text>
      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryButton,
              selectedCategory === item.name && styles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(item.name)}
          >
            <Text
              style={[
                styles.categoryButtonText,
                selectedCategory === item.name &&
                  styles.categoryButtonTextSelected,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        style={{ flexGrow: 0 }}
        contentContainerStyle={styles.categoryList}
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Opret</Text>
      </TouchableOpacity>
    </View>
  );
}
