import { useState } from "react";
import { PhoneField } from "./PhoneField";
import { ProductDeliveryDetails } from "./ProductDeliveryDetails";
import { PrivacyConsentCheckbox } from "./PrivacyConsentCheckbox";

interface ProductInquiryContactProps {
  phoneId: string;
  customerName: string;
  setCustomerName: (value: string) => void;
  phone: string;
  setPhone: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  company: string;
  setCompany: (value: string) => void;
}

const inputClass = "mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral";

/** Single privacy-scoped contact step shared by stand and target inquiries.
 * Store shipping address in the existing customer_location field (no DB
 * migration); pickup retains its legacy "city, postal" representation. */
export function ProductInquiryContact({
  phoneId, customerName, setCustomerName, phone, setPhone,
  email, setEmail, company, setCompany,
}: ProductInquiryContactProps) {
  const [deliveryMode, setDeliveryMode] = useState<"shipping" | "pickup">("shipping");
  const [street, setStreet] = useState("");
  const [postal, setPostal] = useState("");
  const [city, setCity] = useState("");
  const shipping = deliveryMode === "shipping";
  const customerLocation = shipping
    ? [street.trim(), postal.trim(), city.trim()].join(", ")
    : [city.trim(), postal.trim()].join(", ");

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block font-display text-sm font-bold text-forest sm:col-span-2">
          Meno a priezvisko *
          <input name="customer_name" defaultValue={customerName}
            onChange={(event) => setCustomerName(event.target.value)}
            autoComplete="name" required maxLength={160} className={inputClass} />
        </label>
        <PhoneField id={phoneId} value={phone} onChange={setPhone} />
        <label className="block font-display text-sm font-bold text-forest">
          E-mail *
          <input name="email" defaultValue={email} onChange={(event) => setEmail(event.target.value)}
            type="email" autoComplete="email" required maxLength={200} className={inputClass} />
        </label>

        <fieldset data-product-delivery-mode className="min-w-0 sm:col-span-2">
          <legend className="mb-2 font-display text-sm font-bold text-forest">Ako chcete produkt prevziať?</legend>
          <div className="grid grid-cols-2 gap-2">
            {([
              ["shipping", "Doručenie na adresu"],
              ["pickup", "Osobne / po dohode"],
            ] as const).map(([value, label]) => (
              <label key={value} className={"flex min-h-11 min-w-0 cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 font-display text-xs font-semibold leading-snug sm:px-4 sm:text-sm " +
                (deliveryMode === value ? "border-coral bg-coral/10 text-forest" : "border-forest/15 bg-background text-forest/75")}>
                <input type="radio" name="delivery_mode" value={value} checked={deliveryMode === value}
                  onChange={() => setDeliveryMode(value)} className="shrink-0 accent-coral" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {shipping && <label className="block font-display text-sm font-bold text-forest sm:col-span-2">
          Ulica a číslo domu *
          <input name="delivery_street" value={street} onChange={(event) => setStreet(event.target.value)}
            autoComplete="street-address" placeholder="napr. Hlavná 12"
            required maxLength={80} pattern="[^,]{2,80}" title="Zadajte ulicu a číslo domu bez čiarky."
            className={inputClass} />
        </label>}
        <label className="block font-display text-sm font-bold text-forest">
          PSČ *
          <input name="delivery_postal" value={postal} onChange={(event) => setPostal(event.target.value)}
            autoComplete="postal-code" inputMode="numeric" placeholder="040 01" required
            pattern="[0-9]{3}[ ]?[0-9]{2}" title="PSČ napíšte ako 040 01 alebo 04001."
            maxLength={6} className={inputClass} />
        </label>
        <label className="block font-display text-sm font-bold text-forest">
          Mesto / obec *
          <input name="delivery_city" value={city} onChange={(event) => setCity(event.target.value)}
            autoComplete="address-level2" placeholder="Košice" required
            pattern="[^,]{2,70}" title="Napíšte mesto alebo obec bez čiarky."
            maxLength={70} className={inputClass} />
        </label>
        <input type="hidden" name="customer_location" value={customerLocation} />
        <div className="sm:col-span-2">
          <p className="text-xs leading-relaxed text-forest/65">
            {shipping
              ? "Adresu potrebujeme na prípravu doručenia. Dopravu a jej cenu vám ešte potvrdíme pred objednávkou."
              : "Pri osobnom odovzdaní stačí PSČ a mesto. Podrobnosti dohodneme spolu."}
          </p>
          <ProductDeliveryDetails compact />
        </div>
      </div>
      <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        Firma
        <input value={company} onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1} autoComplete="off" />
      </label>
      <div className="mt-5">
        <PrivacyConsentCheckbox />
        <p className="mt-2 text-xs leading-relaxed text-forest/65">
          Údaje z produktového formulára používame na vybavenie dopytu,
          spätný kontakt a prípadné doručenie. Toto potvrdenie nie je
          prihlásenie na marketingové správy.
        </p>
      </div>
    </>
  );
}
