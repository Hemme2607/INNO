// Skærm til at redigere indholdet i et valgt standardsvar.
import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import GlobalStyles, { COLORS } from "../styles/GlobalStyles";

export default function AgentKnowledgeTemplateEditorScreen({
  navigation,
  route,
  searchResults = [],
  searching = false,
  searchError = null,
  onSearch = () => {},
  onSelectMail = () => {},
  selectedMailId = null,
  templateBody = "",
  onChangeTemplateBody = () => {},
  onSaveTemplate = () => {},
  onSaveDraft = () => {},
  sourceBody = "",
  onChangeSourceBody = () => {},
  sourceLoading = false,
  sourceError = null,
  savingTemplate = false,
}) {
  const [query, setQuery] = useState("");
  const [hasSubmittedSearch, setHasSubmittedSearch] = useState(false);

  // Udløser søgning i mailindbakken baseret på lokal query-state
  const handleSearch = () => {
    const trimmed = query.trim();
    setHasSubmittedSearch(true);
    onSearch(trimmed);
  };

  // Gemmer hvilket mail-id der er valgt som kilde
  const handleSelectMail = (mailId) => {
    onSelectMail(mailId);
  };

  // Kalder udkast-handler med nuværende inputs
  const handleSaveDraft = () => {
    onSaveDraft({
      templateBody,
      selectedMailId,
      sourceBody,
    });
  };

  // Gemmer standardsvaret og lukker siden hvis succesfuldt
  const handleSaveTemplate = async () => {
    const saved = await onSaveTemplate({
      templateBody,
      selectedMailId,
      sourceBody,
    });
    if (saved) {
      navigation.goBack();
    }
  };

  const showEmptySearch =
    hasSubmittedSearch && !searching && (!searchResults || searchResults.length === 0);

  return (
    <ScrollView
      style={GlobalStyles.screen}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.fieldBlock}>
        <Text style={styles.heading}>Definér standardsvar</Text>
        <Text style={styles.subheading}>
          Søg efter en tidligere mail eller skriv et nyt scenarie. Agenten bruger svaret som udgangspunkt og
          personaliserer det automatisk.
        </Text>
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Find tidligere mail</Text>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color="rgba(148, 163, 196, 0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Søg efter emne, ordre nr. eller kunde"
            placeholderTextColor="rgba(148, 163, 196, 0.6)"
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity style={styles.searchButton} activeOpacity={0.85} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Søg</Text>
          </TouchableOpacity>
        </View>

        {searching ? (
          <View style={styles.searchStatus}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.searchStatusText}>Søger efter mails…</Text>
          </View>
        ) : null}

        {searchError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        ) : null}

        {showEmptySearch ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-open-outline" size={24} color="rgba(148, 163, 196, 0.6)" />
            <Text style={styles.emptyTitle}>Ingen mails fundet</Text>
            <Text style={styles.emptyDescription}>
              Prøv at søge med et andet emne, et ordre- eller kundenummer.
            </Text>
          </View>
        ) : (
          <View style={styles.mailList}>
            {searchResults.map((mail) => {
              const isSelected = mail.id === selectedMailId;
              return (
                <TouchableOpacity
                  key={mail.id}
                  style={[styles.mailCard, isSelected && styles.mailCardSelected]}
                  activeOpacity={0.88}
                  onPress={() => handleSelectMail(mail.id)}
                >
                  <Text style={styles.mailSubject}>{mail.subject}</Text>
                  {mail.preview ? <Text style={styles.mailPreview}>{mail.preview}</Text> : null}
                  <Text style={styles.mailLink}>{isSelected ? "Valgt" : "Vælg denne mail"}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Mailindhold</Text>
        <Text style={styles.helperText}>
          Skriv eller rediger indholdet fra kundens mail. Hvis du vælger en mail ovenfor, indsætter vi teksten
          automatisk her.
        </Text>
        {sourceLoading ? (
          <View style={styles.sourceStatus}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.sourceStatusText}>Henter mailindhold…</Text>
          </View>
        ) : null}
        {sourceError ? (
          <View style={styles.errorBox}>
            <Ionicons name="warning-outline" size={18} color={COLORS.danger} />
            <Text style={styles.errorText}>{sourceError}</Text>
          </View>
        ) : null}
        <TextInput
          style={styles.sourceInput}
          multiline
          numberOfLines={10}
          placeholder="Beskriv kundens mail eller indsæt indholdet her…"
          placeholderTextColor="rgba(148, 163, 196, 0.6)"
          value={sourceBody}
          onChangeText={onChangeSourceBody}
        />
      </View>

      <View style={styles.fieldBlock}>
        <Text style={styles.label}>Svarskabelon</Text>
        <Text style={styles.helperText}>
          Skriv et udkast til svaret. Agenten tilpasser navne, ordreinfo og tone baseret på kundens situation.
        </Text>
        <TextInput
          style={styles.responseInput}
          multiline
          numberOfLines={12}
          placeholder="Fx: Hej {navn}, tusind tak for din besked..."
          placeholderTextColor="rgba(148, 163, 196, 0.6)"
          value={templateBody}
          onChangeText={onChangeTemplateBody}
        />
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={handleSaveDraft}
          disabled={savingTemplate}
        >
          <Text style={styles.secondaryButtonText}>Gem kladde</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryButton, savingTemplate && styles.primaryButtonDisabled]}
          activeOpacity={0.88}
          onPress={handleSaveTemplate}
          disabled={savingTemplate}
        >
          {savingTemplate ? (
            <ActivityIndicator size="small" color={COLORS.text} />
          ) : (
            <Ionicons name="save-outline" size={18} color={COLORS.text} />
          )}
          <Text style={styles.primaryButtonText}>Gem standardsvar</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    gap: 22,
    backgroundColor: COLORS.background,
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
  },
  subheading: {
    fontSize: 14,
    color: COLORS.muted,
    lineHeight: 20,
  },
  fieldBlock: {
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.muted,
    lineHeight: 18,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.16)",
    backgroundColor: "rgba(11, 16, 27, 0.92)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  searchButton: {
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchButtonText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: "700",
  },
  searchStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchStatusText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  errorBox: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 91, 107, 0.25)",
    backgroundColor: "rgba(255, 91, 107, 0.12)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
    lineHeight: 18,
  },
  mailList: {
    gap: 10,
  },
  mailCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.14)",
    backgroundColor: "rgba(12, 18, 33, 0.9)",
    padding: 16,
    gap: 8,
  },
  mailCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "rgba(77, 124, 255, 0.12)",
  },
  mailSubject: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  mailPreview: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
  },
  mailLink: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: "700",
  },
  emptyState: {
    marginTop: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.12)",
    backgroundColor: "rgba(12, 18, 33, 0.9)",
    padding: 20,
    gap: 8,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.text,
  },
  emptyDescription: {
    fontSize: 13,
    color: COLORS.muted,
    lineHeight: 18,
    textAlign: "center",
  },
  sourceInput: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.18)",
    backgroundColor: "rgba(10, 16, 28, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  sourceStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sourceStatusText: {
    fontSize: 13,
    color: COLORS.muted,
  },
  responseInput: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(77, 124, 255, 0.18)",
    backgroundColor: "rgba(10, 16, 28, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.text,
    fontSize: 14,
    lineHeight: 21,
    textAlignVertical: "top",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 196, 0.35)",
    backgroundColor: "rgba(11, 16, 27, 0.65)",
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: COLORS.muted,
    fontSize: 14,
    fontWeight: "700",
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
  },
  primaryButtonDisabled: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
  },
});
