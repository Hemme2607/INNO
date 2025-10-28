import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-expo";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? null;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null;

export function useShopDomain() {
  const { getToken, isSignedIn } = useAuth();
  const [shopDomain, setShopDomain] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDomain() {
      if (!isSignedIn || !supabaseUrl || !supabaseAnonKey) {
        if (isMounted) {
          setShopDomain(null);
          setIsLoaded(true);
        }
        return;
      }

      try {
        const token = await getToken();
        if (!token) {
          if (isMounted) {
            setShopDomain(null);
            setIsLoaded(true);
          }
          return;
        }

        const response = await fetch(`${supabaseUrl}/rest/v1/shops?select=shop_domain&limit=1`, {
          headers: {
            Authorization: `Bearer ${token}`,
            apikey: supabaseAnonKey,
          },
        });

        if (!response.ok) {
          throw new Error(`Could not load shop domain (${response.status})`);
        }

        const payload = await response.json();
        const resolved =
          Array.isArray(payload) && payload[0]?.shop_domain ? payload[0].shop_domain : null;

        if (isMounted) {
          setShopDomain(resolved);
          setIsLoaded(true);
        }
      } catch (error) {
        if (isMounted) {
          console.warn("Failed to fetch shop domain", error);
          setShopDomain(null);
          setIsLoaded(true);
        }
      }
    }

    fetchDomain();

    return () => {
      isMounted = false;
    };
  }, [getToken, isSignedIn]);

  return { shopDomain, isLoaded };
}
