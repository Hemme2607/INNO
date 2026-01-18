
import crypto from "node:crypto";
import { clerkClient } from "@clerk/nextjs/server";

const GRAPH_BASE_URL =
  process.env.MICROSOFT_GRAPH_BASE_URL?.trim() ||
  "https://graph.microsoft.com/v1.0";
const MICROSOFT_OAUTH_PROVIDER =
  process.env.MICROSOFT_OAUTH_PROVIDER?.trim() || "oauth_microsoft";
const CLIENT_STATE_SECRET =
  process.env.OUTLOOK_CLIENT_STATE_SECRET ||
  process.env.MICROSOFT_CLIENT_STATE_SECRET ||
  "change-me";

function signClientState(userId) {
  const hmac = crypto.createHmac("sha256", CLIENT_STATE_SECRET);
  hmac.update(String(userId));
  return hmac.digest("hex").slice(0, 24);
}

export function buildClientState(userId) {
  if (!userId) return "";
  const signature = signClientState(userId);
  return `${userId}.${signature}`;
}

export function parseAndVerifyClientState(clientState) {
  if (typeof clientState !== "string") {
    return { valid: false, userId: null };
  }
  const [userId, signature] = clientState.split(".");
  if (!userId || !signature) {
    return { valid: false, userId: null };
  }
  const expected = signClientState(userId);
  if (signature.length !== expected.length) {
    return { valid: false, userId: null };
  }
  const valid = crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
  return { valid, userId };
}

async function graphRequest(path, { method = "GET", accessToken, body } = {}) {
  const url =
    path.startsWith("http") || path.startsWith("https")
      ? path
      : `${GRAPH_BASE_URL}${path}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data?.error?.message === "string"
        ? data.error.message
        : "Graph request failed";
    throw new Error(`${message} (${response.status})`);
  }
  return data;
}

export async function getMicrosoftAccessToken(userId) {
  if (!userId) return null;
  try {
    const tokens = await clerkClient.users.getUserOauthAccessToken(
      userId,
      MICROSOFT_OAUTH_PROVIDER
    );
    const token = Array.isArray(tokens) ? tokens[0] : tokens;
    const accessToken =
      typeof token?.token === "string" ? token.token : token?.access_token;
    return accessToken || null;
  } catch (error) {
    console.warn("Could not fetch Microsoft token from Clerk:", error);
    return null;
  }
}

export async function createInboxSubscription({
  accessToken,
  notificationUrl,
  clientState,
  expiresInMinutes = 55,
}) {
  const expiration = new Date(
    Date.now() + expiresInMinutes * 60 * 1000
  ).toISOString();
  return graphRequest("/subscriptions", {
    method: "POST",
    accessToken,
    body: {
      changeType: "created",
      notificationUrl,
      resource: "/me/mailFolders('Inbox')/messages",
      expirationDateTime: expiration,
      clientState,
      includeResourceData: false,
    },
  });
}

export async function renewSubscription({ accessToken, subscriptionId }) {
  const expiration = new Date(Date.now() + 55 * 60 * 1000).toISOString();
  return graphRequest(`/subscriptions/${subscriptionId}`, {
    method: "PATCH",
    accessToken,
    body: { expirationDateTime: expiration },
  });
}

export async function fetchMessage({ accessToken, messageId }) {
  return graphRequest(`/me/messages/${messageId}?$expand=attachments`, {
    method: "GET",
    accessToken,
  });
}

export async function draftReplyToMessage({ accessToken, messageId, bodyHtml }) {
  const draft = await graphRequest(
    `/me/messages/${messageId}/createReply`,
    {
      method: "POST",
      accessToken,
    }
  );
  if (!draft?.id) {
    throw new Error("Reply draft missing id");
  }
  await graphRequest(`/me/messages/${draft.id}`, {
    method: "PATCH",
    accessToken,
    body: {
      body: {
        contentType: "HTML",
        content: bodyHtml,
      },
      isDraft: true,
    },
  });
  return draft.id;
}

export function buildDraftFromMessage(message) {
  const fromName =
    message?.from?.emailAddress?.name ||
    message?.from?.emailAddress?.address ||
    "your email";
  const subject = message?.subject ? `Re: ${message.subject}` : "Reply";
  const preview = message?.bodyPreview?.slice(0, 280) || "";

  return {
    subject,
    html: `
      <p>Hi ${fromName},</p>
      <p>Thanks for your email.</p>
      <p>Summary: ${preview || "No short summary available."}</p>
      <p>---</p>
      <p>Best regards<br/>Sona</p>
    `.trim(),
  };
}
