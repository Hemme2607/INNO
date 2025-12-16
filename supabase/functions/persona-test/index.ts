import { createRemoteJWKSet, jwtVerify } from "https://deno.land/x/jose@v5.2.0/index.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_MODEL = Deno.env.get("OPENAI_MODEL") ?? "gpt-4o-mini";
const CLERK_JWT_ISSUER = Deno.env.get("CLERK_JWT_ISSUER");

if (!OPENAI_API_KEY) console.warn("OPENAI_API_KEY mangler – persona-test kan ikke kalde OpenAI.");
if (!CLERK_JWT_ISSUER) console.warn("CLERK_JWT_ISSUER mangler – Clerk sessioner kan ikke verificeres.");

const JWKS = CLERK_JWT_ISSUER
  ? createRemoteJWKSet(
      new URL(`${CLERK_JWT_ISSUER.replace(/\/$/, "")}/.well-known/jwks.json`),
    )
  : null;

// Udtrækker bearer token fra Authorization header
const readBearerToken = (req: Request): string => {
  const header = req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw Object.assign(new Error("Manglende Clerk session token"), { status: 401 });
  }
  return match[1];
};

// Verificerer Clerk JWT og returnerer subject (user id)
const requireClerkUserId = async (req: Request): Promise<string> => {
  if (!JWKS || !CLERK_JWT_ISSUER) {
    throw Object.assign(
      new Error("CLERK_JWT_ISSUER mangler – kan ikke verificere Clerk session."),
      { status: 500 },
    );
  }
  const token = readBearerToken(req);
  const { payload } = await jwtVerify(token, JWKS, { issuer: CLERK_JWT_ISSUER });
  const sub = payload?.sub;
  if (!sub || typeof sub !== "string") {
    throw Object.assign(new Error("Ugyldigt Clerk token – subject mangler."), { status: 401 });
  }
  return sub;
};

type TestPersonaPayload = {
  signature?: string | null;
  scenario?: string | null;
  instructions?: string | null;
};

// Skræddersyr system-promptet til et kort persona-udkast
const buildSystemPrompt = (userId: string) =>
  [
    "Du er Sona – en hjælpsom kundeservice-agent.",
    "Hold tonen venlig og effektiv, skriv på dansk og brug kun relevante oplysninger.",
    `Skriv et kort eksempel på et svar, som brugeren (id: ${userId}) kan sende til en kunde.`,
    "Eksperimentet er kun en test, så giv ikke endelige løfter og undgå placeholders som {navn} – brug i stedet en generisk hilsen.",
  ].join(" ");

const callOpenAI = async (options: {
  signature: string;
  scenario: string;
  instructions: string;
  userId: string;
}): Promise<string> => {
  // Kalder OpenAI for at generere et kort testsvar baseret på persona-data
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API-nøgle mangler.");
  }

  const body = {
    model: OPENAI_MODEL,
    temperature: 0.4,
    messages: [
      {
        role: "system",
        content: buildSystemPrompt(options.userId),
      },
      {
        role: "user",
        content: [
          `Kundesituation: ${options.scenario || "ukendt"}`,
          `Instruktioner: ${options.instructions || "ingen"}`,
          `Afslut med denne signatur:\n${options.signature}`,
        ].join("\n"),
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (typeof payload?.error?.message === "string" && payload.error.message) ||
      `OpenAI svarede ${response.status}`;
    throw new Error(message);
  }

  const reply = payload?.choices?.[0]?.message?.content;
  if (!reply || typeof reply !== "string") {
    throw new Error("OpenAI returnerede ikke noget svar.");
  }
  return reply.trim();
};

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const clerkUserId = await requireClerkUserId(req);

    const body = (await req.json().catch(() => ({}))) as TestPersonaPayload;
    const signature =
      typeof body?.signature === "string" && body.signature.trim().length
        ? body.signature.trim()
        : "Venlig hilsen\nDin agent";
    const scenario =
      typeof body?.scenario === "string" && body.scenario.trim().length
        ? body.scenario.trim()
        : "kunden har et generelt spørgsmål";
    const instructions =
      typeof body?.instructions === "string" && body.instructions.trim().length
        ? body.instructions.trim()
        : "hold tonen venlig og effektiv";

    const reply = await callOpenAI({
      signature,
      scenario,
      instructions,
      userId: clerkUserId,
    });

    return Response.json({ reply, model: OPENAI_MODEL });
  } catch (error: any) {
    const message =
      (error instanceof Error && error.message) ||
      (typeof error === "string" ? error : "Ukendt fejl");
    const status = typeof error?.status === "number" ? error.status : 500;
    console.warn("persona-test fejl", { status, message });
    return Response.json({ error: message }, { status });
  }
});
