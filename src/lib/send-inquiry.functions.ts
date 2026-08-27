import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const shortSchema = z.object({
  typ: z.literal("informacie"),
  consent: z.literal(true),
  source_ref: z.string().max(300).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().min(1).max(60),
  zaujem: z.string().min(1).max(300),
});

const longSchema = z.object({
  typ: z.literal("prihlaska"),
  consent: z.literal(true),
  source_ref: z.string().max(300).optional(),
  meno: z.string().min(1).max(200),
  telefon: z.string().min(1).max(60),
  pes: z.string().min(1).max(200),
  pohlavie: z.string().min(1).max(40),
  vek: z.string().min(1).max(100),
  kastrovana: z.string().min(1).max(40),
  duvod: z.string().min(1).max(300),
  viac: z.string().max(3000),
});

const schema = z.discriminatedUnion("typ", [shortSchema, longSchema]);

type Input = z.infer<typeof schema>;

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const TO = "chvostikovo.psiaskolka@gmail.com";
const SUPABASE_ENDPOINT =
  "https://tlhcqwsluyqpywymjoxn.supabase.co/functions/v1/web-form-submit";
const ORIGIN = "https://chvostikovo.sk";

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

function buildFields(data: Input): Array<{ label: string; value: string }> {
  if (data.typ === "informacie") {
    return [
      { label: "Meno majiteľa", value: data.meno },
      { label: "Telefón", value: data.telefon },
      { label: "O čo máte záujem?", value: data.zaujem },
      { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
    ];
  }
  return [
    { label: "Meno a priezvisko majiteľa", value: data.meno },
    { label: "Telefón", value: data.telefon },
    { label: "Meno psa", value: data.pes },
    { label: "Pohlavie psa", value: data.pohlavie },
    { label: "Vek psa", value: data.vek },
    { label: "Kastrovaný / sterilizovaná", value: data.kastrovana },
    { label: "Ako plánujete využívať škôlku?", value: data.duvod },
    { label: "Viac o psíkovi", value: data.viac },
    { label: "Súhlas so spracovaním osobných údajov", value: "Áno" },
  ];
}

function buildDbPayload(data: Input) {
  const source_ref = data.source_ref && data.source_ref.length > 0 ? data.source_ref : "/";
  const raw_payload = Object.fromEntries(
    buildFields(data).map((f) => [f.label, f.value]),
  );

  if (data.typ === "informacie") {
    return {
      form_type: "lead",
      owner_name: data.meno,
      phone: data.telefon,
      interest_reason: data.zaujem,
      consent: true,
      source_ref,
      raw_payload,
    };
  }

  return {
    form_type: "application",
    owner_name: data.meno,
    phone: data.telefon,
    dog_name: data.pes,
    dog_sex: data.pohlavie,
    dog_age_text: data.vek,
    dog_neutered: data.kastrovana,
    interest_reason: data.duvod,
    dog_info: data.viac,
    consent: true,
    source_ref,
    raw_payload,
  };
}

async function saveToDatabase(data: Input) {
  const res = await fetch(SUPABASE_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: ORIGIN,
    },
    body: JSON.stringify(buildDbPayload(data)),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase submit failed [${res.status}]: ${text}`);
  }
  return true;
}

async function sendEmail(data: Input) {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const gmailKey = process.env["GOOGLE_MAIL_API_KEY"];
  if (!lovableKey || !gmailKey) throw new Error("Email nie je nakonfigurovaný.");

  const subject =
    data.typ === "prihlaska"
      ? "Nová prihláška do škôlky (web)"
      : "Nový záujem o škôlku (web)";

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
  return true;
}

export const sendInquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const [dbResult, mailResult] = await Promise.allSettled([
      saveToDatabase(data),
      sendEmail(data),
    ]);

    const databaseSaved = dbResult.status === "fulfilled";
    const emailSent = mailResult.status === "fulfilled";

    if (!databaseSaved) console.error("DB save failed:", dbResult.reason);
    if (!emailSent) console.error("Email send failed:", mailResult.reason);

    if (!databaseSaved && !emailSent) {
      throw new Error("Odoslanie zlyhalo.");
    }

    return { ok: true as const, databaseSaved, emailSent };
  });
