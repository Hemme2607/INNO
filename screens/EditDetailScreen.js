import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
} from "react-native";
import GlobalStyles from "../styles/GlobalStyles";

export default function EditDetailScreen({ navigation, route }) {
  const listings = route.params?.listings ?? [];
  const itemIndex = route.params?.itemIndex ?? -1;
  const item = listings[itemIndex];

  const [title, setTitle] = React.useState(item?.title ?? "");
  const [price, setPrice] = React.useState(item?.price ?? "");
  const [description, setDescription] = React.useState(
    item?.description ?? ""
  );
  const [selectedCategory, setSelectedCategory] = React.useState(
    item?.category ?? null
  );

  const categories = [
    { id: "1", name: "Værktøj" },
    { id: "2", name: "Haveudstyr" },
    { id: "3", name: "Køkkenudstyr" },
    { id: "4", name: "Elektronik" },
  ];

  const handleSave = () => {
    if (itemIndex < 0) {
      navigation.goBack();
      return;
    }

    const updatedItem = {
      ...item,
      title,
      price,
      description,
      category: selectedCategory,
    };

    const updatedListings = listings.map((listing, index) =>
      index === itemIndex ? updatedItem : listing
    );

    navigation.navigate("ListingDetails", { listings: updatedListings });
  };

  if (!item) {
    return (
      <View
        style={[GlobalStyles.container, GlobalStyles.editEmptyContainer]}
      >
        <Text style={GlobalStyles.editEmptyText}>
          Kunne ikke finde annoncen at redigere.
        </Text>
        <TouchableOpacity
          style={[GlobalStyles.buttonPrimary, GlobalStyles.editSaveButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={GlobalStyles.buttonPrimaryText}>Tilbage</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      <Text style={GlobalStyles.heading}>Rediger annonce</Text>

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
        keyExtractor={(category) => category.id}
        renderItem={({ item: category }) => (
          <TouchableOpacity
            style={[
              GlobalStyles.categoryButton,
              selectedCategory === category.name &&
                GlobalStyles.categoryButtonSelected,
            ]}
            onPress={() => setSelectedCategory(category.name)}
          >
            <Text
              style={[
                GlobalStyles.categoryButtonText,
                selectedCategory === category.name &&
                  GlobalStyles.categoryButtonTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        )}
        style={{ flexGrow: 0 }}
        contentContainerStyle={GlobalStyles.categoryList}
      />

      <TouchableOpacity
        style={[GlobalStyles.buttonPrimary, GlobalStyles.editSaveButton]}
        onPress={handleSave}
      >
        <Text style={GlobalStyles.buttonPrimaryText}>Gem ændringer</Text>
      </TouchableOpacity>
    </View>
  );
}
