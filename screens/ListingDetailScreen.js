import { View, Text, TouchableOpacity } from "react-native";
import GlobalStyles from "../styles/GlobalStyles";

//Denne skærm viser detaljerne for de annoncer, som brugeren vil have oprettet
export default function ListingDetailScreen({ navigation, route }) {
  const listings = route.params?.listings ?? [];

  if (!listings.length) {
    return (
      <View style={GlobalStyles.container}>
        <Text style={GlobalStyles.description}>
          Der er endnu ikke oprettet nogle annoncer.
        </Text>
      </View>
    );
  }

  return (
    <View style={GlobalStyles.container}>
      {listings.map((item, index) => (
        <View style={GlobalStyles.card} key={index}>
          <Text style={GlobalStyles.detailTitle}>{item.title}</Text>

          <View style={GlobalStyles.infoBox}>
            <Text style={GlobalStyles.price}>Pris: {item.price} kr/dag</Text>
          </View>

          <View style={GlobalStyles.infoBox}>
            <Text style={GlobalStyles.description}>{item.description}</Text>
          </View>

          <View style={GlobalStyles.infoBox}>
            <Text style={GlobalStyles.category}>Kategori: {item.category}</Text>
          </View>

          <TouchableOpacity
            style={GlobalStyles.buttonPrimary}
            onPress={() =>
              navigation.navigate("EditListing", {
                listings,
                itemIndex: index,
              })
            }
          >
            <Text style={GlobalStyles.buttonPrimaryText}>Rediger</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
