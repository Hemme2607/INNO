import * as SecureStore from "expo-secure-store";

// Clerk konfiguration for Expo
// Bruger environment variabel fra .env filen
export const CLERK_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

// Token cache funktion til SecureStore
const memoryFallback = new Map();

const tokenCache = {
  async getToken(key) {
    try {
      const value = await SecureStore.getItemAsync(key);
      if (value !== null) {
        memoryFallback.set(key, value);
      }
      return value ?? memoryFallback.get(key) ?? null;
    } catch (err) {
      console.warn(
        "SecureStore.getItemAsync failed, falling back to in-memory cache:",
        err
      );
      return memoryFallback.get(key) ?? null;
    }
  },
  async saveToken(key, token) {
    try {
      await SecureStore.setItemAsync(key, token);
      memoryFallback.set(key, token);
    } catch (err) {
      console.warn(
        "SecureStore.setItemAsync failed, storing token in-memory instead:",
        err
      );
      if (token === null || typeof token === "undefined") {
        memoryFallback.delete(key);
        return;
      }
      memoryFallback.set(key, token);
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
