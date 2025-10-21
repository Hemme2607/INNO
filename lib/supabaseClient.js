// supabaseClient.js
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';
import { useMemo } from 'react';

export function useClerkSupabase() {
  const { getToken } = useAuth();

  // Opret client der henter et frisk Clerk-token ved hvert kald
  const client = useMemo(() => {
    return createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          persistSession: true,
          storage: {
            getItem: SecureStore.getItemAsync,
            setItem: SecureStore.setItemAsync,
            removeItem: SecureStore.deleteItemAsync,
          },
        },
        // v2 tillader en async accessToken()-hook (som i Clerk-guiden)
        accessToken: async () => {
          // Ingen template nødvendig med den native integration
          return await getToken();
        },
      }
    );
  }, [getToken]);

  return client;
}