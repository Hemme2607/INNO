import { View, Text, FlatList, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../styles/GlobalStyles";

const palette = {
  background: COLORS.surface,
  canvas: "#F6F7FB",
  divider: "#E4E6F4",
  textPrimary: COLORS.text,
  textSecondary: COLORS.muted,
  accent: COLORS.primary,
  avatarBg: COLORS.primary,
};

export default function InboxScreen() {
  const inboxItems = [];

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.avatar}>
        <Text style={styles.avatarLabel}>
          {(item.sender ?? "?").charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeader}>
          <Text style={styles.sender} numberOfLines={1}>
            {item.sender ?? "Afsender"}
          </Text>
          <Text style={styles.time}>{item.time ?? ""}</Text>
        </View>
        <Text style={styles.subject} numberOfLines={1}>
          {item.subject ?? ""}
        </Text>
        <Text style={styles.preview} numberOfLines={2}>
          {item.preview ?? ""}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.heading}>Indbakke</Text>
          <Text style={styles.subtitle}>
            Se nye mails og AI-klargjorte svar her.
          </Text>
        </View>
        <View style={styles.headerActions}>
          <Ionicons
            name="search-outline"
            size={20}
            color={palette.textPrimary}
          />
        </View>
      </View>

      <FlatList
        data={inboxItems}
        keyExtractor={(item, index) => item.id ?? String(index)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          inboxItems.length === 0 && styles.listEmptyContent,
        ]}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons
              name="mail-open-outline"
              size={36}
              color={palette.accent}
            />
            <Text style={styles.emptyHeading}>Din indbakke er tom</Text>
            <Text style={styles.emptySubtitle}>
              Når Sona henter mails fra dine kanaler, vises de her klar til at
              blive behandlet.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: palette.canvas,
  },
  header: {
    backgroundColor: palette.background,
    paddingHorizontal: 24,
    paddingTop: 68,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.divider,
  },
  heading: {
    fontSize: 26,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: palette.textSecondary,
    marginTop: 4,
  },
  headerActions: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECEEFA",
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
  },
  listEmptyContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 32,
  },
  separator: {
    height: 12,
  },
  row: {
    flexDirection: "row",
    backgroundColor: palette.background,
    borderRadius: 18,
    padding: 16,
    gap: 14,
    shadowColor: "#141736",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.avatarBg,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLabel: {
    color: COLORS.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  rowContent: {
    flex: 1,
    gap: 6,
  },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  sender: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  time: {
    fontSize: 12,
    color: palette.textSecondary,
  },
  subject: {
    fontSize: 15,
    fontWeight: "600",
    color: palette.textPrimary,
  },
  preview: {
    fontSize: 13,
    color: palette.textSecondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: "center",
    gap: 8,
  },
  emptyHeading: {
    fontSize: 18,
    fontWeight: "700",
    color: palette.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: palette.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
