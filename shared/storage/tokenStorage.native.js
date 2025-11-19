import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const memoryFallback = new Map();

const storageImpl =
  Platform.OS === "web"
    ? {
        getItem: (key) => AsyncStorage.getItem(key),
        setItem: (key, value) => AsyncStorage.setItem(key, value),
        deleteItem: (key) => AsyncStorage.removeItem(key),
      }
    : {
        getItem: (key) => SecureStore.getItemAsync(key),
        setItem: (key, value) => SecureStore.setItemAsync(key, value),
        deleteItem: (key) => SecureStore.deleteItemAsync(key),
      };

async function safeStorageCall(action, key, value) {
  try {
    return await action(key, value);
  } catch (error) {
    console.warn(`[tokenStorage] ${key} kunne ikke persisteres:`, error);
    return undefined;
  }
}

export async function readPersistedItem(key) {
  const value = await safeStorageCall(storageImpl.getItem, key);

  if (typeof value === "string") {
    memoryFallback.set(key, value);
    return value;
  }

  return memoryFallback.get(key) ?? null;
}

export async function writePersistedItem(key, value) {
  if (value === null || typeof value === "undefined") {
    await removePersistedItem(key);
    return;
  }

  await safeStorageCall(storageImpl.setItem, key, value);
  memoryFallback.set(key, value);
}

export async function removePersistedItem(key) {
  await safeStorageCall(storageImpl.deleteItem, key);
  memoryFallback.delete(key);
}

export const tokenCache = {
  async getToken(key) {
    return readPersistedItem(key);
  },
  async saveToken(key, value) {
    if (!value) {
      await removePersistedItem(key);
      return;
    }
    await writePersistedItem(key, value);
  },
};

export const supabaseStorageAdapter = {
  getItem: readPersistedItem,
  setItem: writePersistedItem,
  removeItem: removePersistedItem,
};
