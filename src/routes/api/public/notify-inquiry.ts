import { createFileRoute } from "@tanstack/react-router";

import { buildFields, inquirySchema, type InquiryInput } from "@/lib/inquiry";

/**
 * E-mailové upozornenie na nový formulár.
 * Beží iba na Lovable hostingu; frontend ho volá best-effort, takže
 * na statickom hostingu (GitHub Pages) sa iba preskočí.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const TO = "chvostikovo.psiaskolka@gmail.com";

function b64(bytes: Uint8Array) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64url(str: string) {
  return b64(new TextEncoder().encode(str))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function encodeSubject(subject: string) {
  return `=?UTF-8?B?${b64(new TextEncoder().encode(subject))}?=`;
}

async function sendEmail(data: InquiryInput) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const gmailKey = process.env["GOOGLE_MAIL_API_KEY"];
  if (!lovableKey || !gmailKey) throw new Error("Email nie je nakonfigurovaný.");

  const subject =
    data.typ === "prihlaska" ? "Nová prihláška do škôlky (web)" : "Nový záujem o škôlku (web)";

  const body = buildFields(data)
    .filter((f) => f.value.trim().length > 0)
    .map((f) => `${f.label}: ${f.value}`)
    .join("\n");

  const raw = [
    `To: ${TO}`,
    `Subject: ${encodeSubject(subject)}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "MIME-Version: 1.0",
    "Content-Transfer-Encoding: base64",
    "",
    b64(new TextEncoder().encode(`${body}\n`)),
  ].join("\r\n");

  const res = await fetch(`${GATEWAY_URL}/users/me/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": gmailKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: b64url(raw) }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gmail send failed [${res.status}]: ${text}`);
  }
}

export const Route = createFileRoute("/api/public/notify-inquiry")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response("Bad request", { status: 400 });
        }

        const parsed = inquirySchema.safeParse(payload);
        if (!parsed.success) {
          return new Response("Invalid payload", { status: 400 });
        }

        try {
          await sendEmail(parsed.data);
        } catch (error) {
          console.error(error);
          return new Response("Email failed", { status: 502 });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});
