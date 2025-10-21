import { useEffect, useMemo, useState } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useClerkSupabase } from "./supabaseClient";


export function useDisplayName() {
  const { user } = useUser();
  const supabase = useClerkSupabase();

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

  useEffect(() => {
    setDisplayName(fallbackName);
  }, [fallbackName]);

  useEffect(() => {
    let isMounted = true;

    async function loadProfileName() {
      if (!supabase || !user?.id) {
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (!error && data?.first_name) {
        setDisplayName(data.first_name);
        return;
      }

      if (!error && !data?.first_name) {
        const { data: altData, error: altError } = await supabase
          .from("profiles")
          .select("first_name")
          .eq("clerk_id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (!altError && altData?.first_name) {
          setDisplayName(altData.first_name);
        }
      }
    }

    loadProfileName();

    return () => {
      isMounted = false;
    };
  }, [supabase, user?.id]);

  return displayName;
}
