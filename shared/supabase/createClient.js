import { createClient } from "@supabase/supabase-js";

export function createClerkSupabaseClient({
  supabaseUrl,
  supabaseAnonKey,
  getToken,
  storage,
  tokenTemplate = "supabase",
}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase konfiguration mangler. Kontrollér URL og ANON key.");
  }

  if (typeof getToken !== "function") {
    throw new Error("Clerk getToken funktion mangler.");
  }

  const resolveAccessToken = async () => {
    try {
      const templateToken = await getToken({ template: tokenTemplate });
      if (templateToken) {
        return templateToken;
      }
      console.warn(
        `Clerk token template '${tokenTemplate}' returnerede intet token. Fald tilbage til default token.`
      );
      return getToken();
    } catch (error) {
      console.warn(
        `Kunne ikke hente Clerk token med templaten '${tokenTemplate}'. Fald tilbage til standard-token.`,
        error
      );
      return getToken();
    }
  };

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storage,
    },
    accessToken: resolveAccessToken,
  });
}
