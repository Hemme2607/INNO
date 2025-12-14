// Opretter Supabase-klienten med Clerk tokens og lokal token-cache til mobilen.
import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";
import { createClerkSupabaseClient } from "../../../shared/supabase/createClient";
import { supabaseStorageAdapter } from "../../../shared/storage/tokenStorage";

// Returnerer en memoiseret Supabase-klient bundet til Clerk-tokenet
export function useClerkSupabase() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const clientRef = useRef(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  if (!clientRef.current) {
    const supabaseUrl =
      process.env.EXPO_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    clientRef.current = createClerkSupabaseClient({
      supabaseUrl,
      supabaseAnonKey,
      getToken: (...args) => getTokenRef.current?.(...args),
      storage: supabaseStorageAdapter,
      tokenTemplate:
        process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() ||
        process.env.NEXT_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() ||
        "supabase",
    });
  }

  return clientRef.current;
}
