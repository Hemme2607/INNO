import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useClerkSupabase } from "../supabaseClient";
import { resolveProfileFirstName } from "../supabase/profileService";

// Hook der finder det bedste navn at vise for den aktuelle Clerk-bruger
export function useDisplayName() {
  const { user } = useUser();
  const supabase = useClerkSupabase();

  // Lokal fallback bruges straks mens Supabase-opslaget kører
  const fallbackName = useMemo(() => {
    return (
      user?.firstName ??
      user?.fullName ??
      user?.primaryEmailAddress?.emailAddress ??
      "ukendt bruger"
    );
  }, [
    user?.firstName,
    user?.fullName,
    user?.primaryEmailAddress?.emailAddress,
  ]);

  const [displayName, setDisplayName] = useState(fallbackName);

  // Opdater fallback hvis Clerk sender nye brugerdata ned
  useEffect(() => {
    setDisplayName(fallbackName);
  }, [fallbackName]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileName() {
      if (!supabase || !user?.id) {
        return;
      }

      // Prøv først Supabase-profilen og fald tilbage til Clerk-id hvis nødvendigt
      const lookup = await resolveProfileFirstName(supabase, {
        profileId:
          user?.unsafeMetadata?.profile_id ??
          user?.publicMetadata?.profile_id ??
          null,
        clerkId: user.id,
      });

      if (!isMounted) {
        return;
      }

      // Overskriv kun hvis vi har et brugbart navn uden fejl
      if (!lookup.error && lookup.data) {
        setDisplayName(lookup.data);
      }
    }

    loadProfileName();

    return () => {
      isMounted = false;
    };
  }, [
    supabase,
    user?.id,
    user?.publicMetadata?.profile_id,
    user?.unsafeMetadata?.profile_id,
  ]);

  return displayName;
}
