import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import GlobalStyles from "../styles/GlobalStyles";

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
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Opret annonce</Text>

      <Text style={GlobalStyles.label}>Titel</Text>
      <TextInput
        style={GlobalStyles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="F.eks. Plæneklipper"
      />

      <Text style={GlobalStyles.label}>Pris (kr/dag)</Text>
      <TextInput
        style={GlobalStyles.input}
        value={price}
        onChangeText={setPrice}
        placeholder="F.eks. 100"
        keyboardType="numeric"
      />

      <Text style={GlobalStyles.label}>Beskrivelse</Text>
      <TextInput
        style={[GlobalStyles.input, { height: 100, textAlignVertical: "top" }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Skriv en kort beskrivelse..."
        multiline
      />

      <Text style={GlobalStyles.label}>Vælg kategori</Text>
      <FlatList
        data={categories}
        numColumns={2}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              GlobalStyles.categoryButton,
              selectedCategory === item.name &&
                GlobalStyles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(item.name)}
          >
            <Text
              style={[
                GlobalStyles.categoryButtonText,
                selectedCategory === item.name &&
                  GlobalStyles.categoryButtonTextSelected,
              ]}
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
        style={{ flexGrow: 0 }}
        contentContainerStyle={GlobalStyles.categoryList}
      />

      <TouchableOpacity
        style={GlobalStyles.buttonPrimary}
        onPress={handleSubmit}
      >
        <Text style={GlobalStyles.buttonText}>Opret</Text>
      </TouchableOpacity>
    </View>
  );
}
