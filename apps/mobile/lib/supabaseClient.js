// supabaseClient.js
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/clerk-expo";
import { useEffect, useRef } from "react";
import { supabaseStorageAdapter } from "./storage/tokenStorage";

export function useClerkSupabase() {
  const { getToken } = useAuth();
  const getTokenRef = useRef(getToken);
  const clientRef = useRef(null);

  useEffect(() => {
    getTokenRef.current = getToken;
  }, [getToken]);

  if (!clientRef.current) {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Supabase konfiguration mangler. Tilføj URL og ANON key i .env.");
    }

    const resolveAccessToken = async () => {
      const tokenGetter = getTokenRef.current;
      if (!tokenGetter) {
        return null;
      }
      const templateId =
        process.env.EXPO_PUBLIC_CLERK_SUPABASE_TEMPLATE?.trim() || "supabase";
      try {
        const templateToken = await tokenGetter({ template: templateId });
        if (templateToken) {
          return templateToken;
        }
        console.warn(
          `Clerk token template '${templateId}' returnerede intet token. Tjek at templaten er konfigureret.`
        );
        return tokenGetter();
      } catch (error) {
        console.warn(
          `Kunne ikke hente Clerk token med templaten '${templateId}'. Fald tilbage til standard-token.`,
          error
        );
        return tokenGetter();
      }
    };

    clientRef.current = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storage: supabaseStorageAdapter,
      },
      // Brug Clerk-token til Supabase RLS for hver request uden at re-instantiere klienten
      accessToken: resolveAccessToken,
    });
  }

  return clientRef.current;
}
