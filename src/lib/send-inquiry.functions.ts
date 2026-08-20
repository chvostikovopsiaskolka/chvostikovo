import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  typ: z.enum(["informacie", "prihlaska"]),
  fields: z.array(z.object({ label: z.string().max(120), value: z.string().max(3000) })).max(20),
});

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

export const sendInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const gmailKey = process.env["GOOGLE_MAIL_API_KEY"];
    if (!lovableKey || !gmailKey) throw new Error("Email nie je nakonfigurovaný.");

    const subject =
      data.typ === "prihlaska"
        ? "Nová prihláška do škôlky (web)"
        : "Nová správa z formulára (web)";

    const body = data.fields
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
      console.error(`Gmail send failed [${res.status}]: ${text}`);
      throw new Error(`Odoslanie zlyhalo [${res.status}]`);
    }

    return { ok: true as const };
  });
