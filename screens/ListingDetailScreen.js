import { View, Text, TouchableOpacity } from "react-native";
import styles from "../styles/listingDetailScreenStyle";

export default function ListingDetailScreen({ route }) {
  const { listings } = route.params;

  return (
    <View style={styles.container}>
      {listings.map((item, index) => (
        <View style={styles.card} key={index}>
          <Text style={styles.title}>{item.title}</Text>

          <View style={styles.infoBox}>
            <Text style={styles.price}>Pris: {item.price} kr/dag</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.category}>Kategori: {item.category}</Text>
          </View>

          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Rediger</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
}
