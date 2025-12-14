// Hjælpefunktioner til at hente profiloplysninger og fornavn fra Supabase.
const PROFILE_TABLE = "profiles";
const PROFILE_COLUMNS = "id, clerk_id, first_name";

// Fælles helper der henter én profilrække baseret på de givne filtre
async function fetchSingleProfile(supabase, filters) {
  return supabase
    .from(PROFILE_TABLE)
    .select(PROFILE_COLUMNS)
    .match(filters)
    .maybeSingle();
}

// Finder profil via intern id
export async function fetchProfileById(supabase, id) {
  if (!id) {
    return { data: null, error: new Error("Profil-id mangler") };
  }

  return fetchSingleProfile(supabase, { id });
}

// Finder profil via Clerk-id
export async function fetchProfileByClerkId(supabase, clerkId) {
  if (!clerkId) {
    return { data: null, error: new Error("Clerk-id mangler") };
  }

  return fetchSingleProfile(supabase, { clerk_id: clerkId });
}

// Returnerer fornavn fra profil baseret på profil-id eller Clerk-id
export async function resolveProfileFirstName(supabase, { profileId, clerkId }) {
  if (!supabase) {
    return { data: null, error: new Error("Supabase klient mangler") };
  }

  // Slå først op på den interne profil-id hvis vi kender den
  const primaryLookup = profileId
    ? await fetchProfileById(supabase, profileId)
    : { data: null, error: null };

  if (primaryLookup?.data?.first_name) {
    return { data: primaryLookup.data.first_name, error: null };
  }

  // Hvis første opsalg fejler og vi ikke har et id, skal vi ikke forsøge mere
  if (primaryLookup?.error && !profileId) {
    return { data: null, error: primaryLookup.error };
  }

  if (!clerkId) {
    return { data: null, error: primaryLookup?.error ?? null };
  }

  // Ellers falder vi tilbage til Clerk-id og returnerer det bedste match
  const clerkLookup = await fetchProfileByClerkId(supabase, clerkId);
  return {
    data: clerkLookup?.data?.first_name ?? null,
    error: clerkLookup?.error ?? primaryLookup?.error ?? null,
  };
}
