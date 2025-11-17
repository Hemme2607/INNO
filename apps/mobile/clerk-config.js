import { tokenCache } from "./lib/storage/tokenStorage";
import {
  CLERK_PUBLISHABLE_KEY,
  buildBaseClerkConfig,
} from "../../shared/clerk";

export { CLERK_PUBLISHABLE_KEY };

// Clerk konfiguration specifik for Expo
export const clerkConfig = buildBaseClerkConfig({
  tokenCache,
});
