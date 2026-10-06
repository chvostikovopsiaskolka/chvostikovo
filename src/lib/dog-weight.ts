export function parseDogWeightKg(value: unknown): number | null {
  const text = String(value ?? "").trim().replace(/\s*kg\s*$/i, "").trim();
  if (!/^\d+(?:[.,]\d+)?$/.test(text)) return null;
  const weight = Number(text.replace(",", "."));
  return Number.isFinite(weight) && weight > 0 && weight <= 150 ? weight : null;
}
