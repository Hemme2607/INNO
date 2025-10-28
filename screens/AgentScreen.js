import { useEffect, useMemo, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { COLORS } from "../styles/GlobalStyles";
import AgentOverviewScreen from "./AgentOverviewScreen";
import AgentPersonaDetailsScreen from "./AgentPersonaDetailsScreen";
import AgentKnowledgeTemplatesScreen from "./AgentKnowledgeTemplatesScreen";
import AgentKnowledgeDocumentsScreen from "./AgentKnowledgeDocumentsScreen";
import { useDisplayName } from "../lib/hooks/useDisplayName";
import { useShopDomain } from "../lib/hooks/useShopDomain";

const AgentStack = createNativeStackNavigator();

export default function AgentScreen() {
  const displayName = useDisplayName();
  const { shopDomain } = useShopDomain();
  const [personaConfig, setPersonaConfig] = useState({
    signature: "",
    scenario: "",
    instructions: "",
  });

  const defaultSignature = useMemo(() => {
    const trimmedName = displayName?.trim();
    const trimmedShop = shopDomain?.trim();

    const nameLine = trimmedName && trimmedName.length ? trimmedName : "Din agent";
    const shopLine = trimmedShop && trimmedShop.length ? `\n${trimmedShop}` : "";

    return `Venlig hilsen\n${nameLine}${shopLine}`;
  }, [displayName, shopDomain]);

  useEffect(() => {
    if (!defaultSignature) {
      return;
    }

    setPersonaConfig((prev) => {
      if (prev.signature && prev.signature.trim().length) {
        return prev;
      }
      return { ...prev, signature: defaultSignature };
    });
  }, [defaultSignature]);

  return (
    <AgentStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.surfaceAlt,
        },
        headerTintColor: COLORS.text,
        headerTitleStyle: {
          fontSize: 16,
          fontWeight: "700",
        },
        contentStyle: {
          backgroundColor: COLORS.background,
        },
      }}
    >
      <AgentStack.Screen
        name="AgentOverview"
        options={{ headerShown: false }}
      >
        {(props) => (
          <AgentOverviewScreen
            {...props}
            onOpenPersona={() => props.navigation.navigate("AgentPersonaDetails")}
            onOpenTemplates={() => props.navigation.navigate("AgentKnowledgeTemplates")}
            onOpenDocuments={() => props.navigation.navigate("AgentKnowledgeDocuments")}
            personaConfig={personaConfig}
            defaultSignature={defaultSignature}
            displayName={displayName}
            shopDomain={shopDomain}
          />
        )}
      </AgentStack.Screen>
      <AgentStack.Screen
        name="AgentPersonaDetails"
        options={{ title: "Tilpas agent" }}
      >
        {(props) => (
          <AgentPersonaDetailsScreen
            {...props}
            personaConfig={personaConfig}
            defaultSignature={defaultSignature}
            onUpdatePersonaConfig={setPersonaConfig}
          />
        )}
      </AgentStack.Screen>
      <AgentStack.Screen
        name="AgentKnowledgeTemplates"
        component={AgentKnowledgeTemplatesScreen}
        options={{ title: "Standardsvar" }}
      />
      <AgentStack.Screen
        name="AgentKnowledgeDocuments"
        component={AgentKnowledgeDocumentsScreen}
        options={{ title: "Dokumentbibliotek" }}
      />
    </AgentStack.Navigator>
  );
}
