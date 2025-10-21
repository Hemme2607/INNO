import { serve } from "https://deno.land/std/http/server.ts";
import { Webhook } from "https://esm.sh/svix@1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
serve(async (req)=>{
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405
    });
  }
  // Læs rå body (Clerk/Svix sender raw text)
  const payload = await req.text();
  const headers = {
    "svix-id": req.headers.get("svix-id") ?? "",
    "svix-timestamp": req.headers.get("svix-timestamp") ?? "",
    "svix-signature": req.headers.get("svix-signature") ?? ""
  };
  // Verificér Svix-signatur
  const CLERK_SECRET = Deno.env.get("CLERK_WEBHOOK_SECRET");
  if (!CLERK_SECRET) {
    return new Response("Missing CLERK_WEBHOOK_SECRET", {
      status: 500
    });
  }
  let evt;
  try {
    const wh = new Webhook(CLERK_SECRET);
    evt = wh.verify(payload, headers);
  } catch  {
    // Manglende/ugyldige Svix-headers -> korrekt 400
    return new Response("Invalid signature", {
      status: 400
    });
  }
  const { type, data } = evt;
  // Opret Supabase-klienten først nu (efter verifikation)
  const PROJECT_URL = Deno.env.get("PROJECT_URL") ?? Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!PROJECT_URL || !SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase secrets", {
      status: 500
    });
  }
  const supabase = createClient(PROJECT_URL, SERVICE_ROLE_KEY);
  try {
    if (type === "user.created" || type === "user.updated") {
      const email = data.email_addresses?.[0]?.email_address ?? null;
      const { error } = await supabase.from("profiles").upsert({
        clerk_user_id: data.id,
        email,
        first_name: data.first_name ?? null,
        last_name: data.last_name ?? null,
        image_url: data.image_url ?? null
      }, {
        onConflict: "clerk_user_id"
      });
      if (error) {
        return new Response(`Upsert error: ${error.message}`, {
          status: 500
        });
      }
    } else if (type === "user.deleted") {
      const { error } = await supabase.from("profiles").delete().eq("clerk_user_id", data.id);
      if (error) {
        return new Response(`Delete error: ${error.message}`, {
          status: 500
        });
      }
    }
    return new Response(JSON.stringify({
      ok: true
    }), {
      headers: {
        "content-type": "application/json"
      },
      status: 200
    });
  } catch (e) {
    return new Response(`Unhandled error: ${e?.message ?? e}`, {
      status: 500
    });
  }
});
