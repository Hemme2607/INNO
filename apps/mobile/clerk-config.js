// Expo-specifik Clerk-konfiguration og eksport af publishable key.
import { tokenCache } from "../../shared/storage/tokenStorage";
import {
  CLERK_PUBLISHABLE_KEY,
  buildBaseClerkConfig,
} from "../../shared/clerk";

export { CLERK_PUBLISHABLE_KEY };

// Clerk konfiguration specifik for Expo
export const clerkConfig = buildBaseClerkConfig({
  tokenCache,
});
