const memoryFallback = new Map();

function getLocalStorage() {
  if (typeof window !== "undefined" && window?.localStorage) {
    return window.localStorage;
  }
  return null;
}

async function safeStorageCall(action) {
  try {
    return await action();
  } catch (error) {
    console.warn("[tokenStorage:web] kunne ikke persistere nøgle:", error);
    return undefined;
  }
}

export async function readPersistedItem(key) {
  const storage = getLocalStorage();
  if (storage) {
    const value = await safeStorageCall(() => storage.getItem(key));
    if (typeof value === "string") {
      memoryFallback.set(key, value);
      return value;
    }
  }
  return memoryFallback.get(key) ?? null;
}

export async function writePersistedItem(key, value) {
  const storage = getLocalStorage();
  if (value === null || typeof value === "undefined") {
    await removePersistedItem(key);
    return;
  }
  if (storage) {
    await safeStorageCall(() => storage.setItem(key, value));
  }
  memoryFallback.set(key, value);
}

export async function removePersistedItem(key) {
  const storage = getLocalStorage();
  if (storage) {
    await safeStorageCall(() => storage.removeItem(key));
  }
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
