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
  customerLocation?: string;
  setCustomerLocation?: (value: string) => void;
  company: string;
  setCompany: (value: string) => void;
}

const inputClass = "mt-2 w-full rounded-2xl border border-forest/15 bg-background px-4 py-3 font-sans text-base font-normal outline-none focus:border-coral";

export function ProductInquiryContact({
  phoneId, customerName, setCustomerName, phone, setPhone,
  email, setEmail, customerLocation, setCustomerLocation, company, setCompany,
}: ProductInquiryContactProps) {
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
        <div className="sm:col-span-2">
          <label className="block font-display text-sm font-bold text-forest">
            Odkiaľ ste? (mesto, PSČ) *
            <input name="customer_location" autoComplete="off"
              {...(setCustomerLocation ? { value: customerLocation ?? "", onChange: (event: React.ChangeEvent<HTMLInputElement>) => setCustomerLocation(event.target.value) } : {})}
              placeholder="napr. Košice, 040 01"
              required maxLength={120} pattern="[^,]{2,80},[ ]*.{2,20}"
              title="Napíšte mesto a PSČ oddelené čiarkou, napr. Košice, 040 01"
              className={inputClass} />
          </label>
          <ProductDeliveryDetails compact />
        </div>
      </div>
      <label className="absolute -left-[10000px] top-auto size-px overflow-hidden" aria-hidden="true">
        Firma
        <input value={company} onChange={(event) => setCompany(event.target.value)}
          tabIndex={-1} autoComplete="off" />
      </label>
      <div className="mt-5"><PrivacyConsentCheckbox /></div>
    </>
  );
}
