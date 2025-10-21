import { serve } from "https://deno.land/std/http/server.ts";
import { Webhook } from "https://esm.sh/svix@1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Simpel Clerk webhook, sørger for at vi kun reagerer på POST
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Læs rå payload og Svix-headere som Clerk kræver
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? "",
  };

  const CLERK_SECRET = Deno.env.get("CLERK_WEBHOOK_SECRET");
  if (!CLERK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", { status: 500 });
  }

  let evt;
  try {
    const wh = new Webhook(CLERK_SECRET);
    evt = wh.verify(payload, headers);
  } catch (_err) {
    // Clerk/Svix fortæller at signaturen ikke matcher → 400 er forventet
    return new Response("Invalid signature", { status: 400 });
  }

  const { type, data } = evt;

  // Vi forbinder først til Supabase efter vi har verificeret eventet
  const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY =
    Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase secrets", { status: 500 });
  }

  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);

  try {
    if (type === "user.created" || type === "user.updated") {
      // Opdater profil-tabellen når Clerk-bruger oprettes/ændres
      const email = data.email_addresses?.[0]?.email_address ?? null;
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            clerk_user_id: data.id,
            email,
            first_name: data.first_name ?? null,
            last_name: data.last_name ?? null,
            image_url: data.image_url ?? null,
          },
          { onConflict: "clerk_user_id" }
        );

      if (error) {
        return new Response(`Upsert error: ${error.message}`, { status: 500 });
      }
    } else if (type === "user.deleted") {
      // Ryd op hvis en bruger slettes i Clerk
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("clerk_user_id", data.id);

      if (error) {
        return new Response(`Delete error: ${error.message}`, { status: 500 });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "content-type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(`Unhandled error: ${error?.message ?? error}`, {
      status: 500,
    });
  }
});
