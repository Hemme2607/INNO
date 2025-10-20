import { View, Text, FlatList } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function InboxScreen() {
  const inboxItems = [];

  // Render-funktion for hver indbakke-post
  const renderItem = ({ item }) => (
    <View style={GlobalStyles.inboxRow}>
      <View style={GlobalStyles.inboxAvatar}>
        <Text style={GlobalStyles.inboxAvatarLabel}>
          {(item.sender ?? "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={GlobalStyles.inboxRowContent}>
        <View style={GlobalStyles.inboxRowHeader}>
          <Text style={GlobalStyles.inboxSender} numberOfLines={1}>
            {item.sender ?? "Afsender"}
          </Text>
          <Text style={GlobalStyles.inboxTime}>{item.time ?? ""}</Text>
        </View>
        <Text style={GlobalStyles.inboxSubject} numberOfLines={1}>
          {item.subject ?? ""}
        </Text>
        <Text style={GlobalStyles.inboxPreview} numberOfLines={2}>
          {item.preview ?? ""}
        </Text>
      </View>
    </View>
  );

  // Opbygning af InboxScreen-komponenten
  return (
    <LinearGradient
      colors={[COLORS.background, COLORS.surfaceAlt]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={GlobalStyles.inboxScreen}
    >
      <View style={GlobalStyles.inboxTopDivider} />
      <View style={GlobalStyles.inboxHeader}>
        <View>
          <Text style={GlobalStyles.inboxHeading}>Indbakke</Text>
          <Text style={GlobalStyles.inboxSubtitle}>
            Se nye mails og AI-klargjorte svar her.
          </Text>
        </View>
        <View style={GlobalStyles.inboxHeaderButton}>
          <Ionicons
            name="search-outline"
            size={20}
            color={COLORS.text}
          />
        </View>
      </View>


      <FlatList
        data={inboxItems}
        keyExtractor={(item, index) => item.id ?? String(index)}
        renderItem={renderItem}
        contentContainerStyle={[
          GlobalStyles.inboxListContent,
          inboxItems.length === 0 && GlobalStyles.inboxListEmptyContent,
        ]}
        ItemSeparatorComponent={() => <View style={GlobalStyles.inboxSeparator} />}
        ListEmptyComponent={
          <View style={GlobalStyles.inboxEmptyState}>
            <Ionicons
              name="mail-open-outline"
              size={36}
              color={COLORS.primary}
            />
            <Text style={GlobalStyles.inboxEmptyHeading}>Din indbakke er tom</Text>
            <Text style={GlobalStyles.inboxEmptySubtitle}>
              Når Sona henter mails fra dine kanaler, vises de her klar til at
              blive behandlet.
            </Text>
          </View>
        }
      />
    </LinearGradient>
  );
}
