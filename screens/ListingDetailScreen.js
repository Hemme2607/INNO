import { View, Text, TouchableOpacity } from "react-native";
import GlobalStyles from "../styles/GlobalStyles";

//Denne skærm viser detaljerne for de annoncer, som brugeren vil have oprettet
export default function ListingDetailScreen({ route }) {
  const { listings } = route.params;
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

          <TouchableOpacity style={GlobalStyles.buttonPrimary}>
            <Text style={GlobalStyles.buttonText}>Rediger</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
