import * as SecureStore from "expo-secure-store";

// Clerk konfiguration for Expo
// Bruger environment variabel fra .env filen
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Token cache funktion til SecureStore
const tokenCache = {
  async getToken(key) {
    try {
      return SecureStore.getItemAsync(key);
    } catch (err) {
      return null;
    }
  },
  async saveToken(key, token) {
    try {
      return SecureStore.setItemAsync(key, token);
    } catch (err) {
      return;
    }
  },
};

// Clerk konfiguration specifik for Expo
export const clerkConfig = {
  publishableKey: CLERK_PUBLISHABLE_KEY,
  // Expo specifikke indstillinger
  frontendApi: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  // Aktiver Expo optimeringer
  isSatellite: false,
  domain: undefined, // Bruger default Clerk domain
  // Token cache for sikker storage
  tokenCache,
};
