import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Privacy Policy | Chvostíkovo";
const description = "Privacy information for the Chvostíkovo website and customer mobile app.";
const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/en/privacy`;

export const Route = createFileRoute("/en/privacy")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: EnglishPrivacy,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 font-display text-xl font-bold text-forest">{children}</h2>;
}

function EnglishPrivacy() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/en/dog-daycare-kosice" className="font-display text-sm font-semibold text-coral">
        ← Back to the English page
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Privacy Policy</h1>
      <p className="mt-2 text-sm text-forest/70">Website and customer app · updated 1 November 2026</p>

      <div className="mt-6 space-y-4 text-forest/85">
        <H2>1. Introduction</H2>
        <p>
          This Privacy Policy applies to the website chvostikovo.sk, enquiry forms and the Chvostíkovo customer portal at app.chvostikovo.sk, including the mobile app.
        </p>
        <p>
          The data controller is Marek Leder – Bellaris, Company ID 56 447 001, registered business address Miškovecká 1023/2, 040 11 Košice-Juh, Slovakia; Chvostíkovo daycare at Poľská 2207/6, 040 01 Košice-Juh.
        </p>

        <H2>2. Personal data we process</H2>
        <p>We may process the following categories of personal data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Contact details:</strong> name, surname, e-mail address and telephone number.</li>
          <li><strong>Visit data:</strong> IP address, information about activity on our website, cookies, browser and device information.</li>
        </ul>

        <p>
          <strong>Customer app:</strong> we process registration and contact details (name, e-mail,
          phone number), login and account status, dog details (name, breed, age, weight,
          temperament, health restrictions, allergies and vaccinations), photos of dogs and
          vaccination records, bookings, visits, passes, transport requests and messages.
          Technical session data, error logs and optional push-notification identifiers
          may be processed to maintain the service.
        </p>

        <H2>3. Purposes of processing</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Providing services:</strong> to respond to enquiries, communicate with you and provide website functionality.</li>
          <li><strong>Marketing communications:</strong> to send informational or advertising messages where you have given consent.</li>
          <li><strong>Improving our services:</strong> to analyse and improve our services and website.</li>
        </ul>

        <p>
          Customer data supports account administration, bookings, dog care and communication.
          Optional sharing of a dog's name and photo with other customers is controlled by
          a separate changeable setting. Registration is not consent to marketing.
        </p>

        <H2>4. Legal basis</H2>
        <p>We process personal data on the basis of:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Consent:</strong> where you have given consent for a specific purpose.</li>
          <li><strong>Performance of a contract:</strong> where processing is necessary to perform a contract with you.</li>
          <li><strong>Legitimate interests:</strong> for example to protect our systems and improve our services.</li>
        </ul>

        <p>
          Legal bases may also include steps before entering into a contract (GDPR Article 6(1)(b))
          and legal obligations (Article 6(1)(c)); legitimate interests (Article 6(1)(f))
          may apply for security and legal claims. A required acknowledgement of this policy
          is not blanket consent to all processing.
        </p>

        <H2>5. Retention</H2>
        <p>
          We retain personal data only for as long as necessary for the purpose for which it was collected or for the period required by applicable law.
        </p>

        <H2>6. Your rights</H2>
        <p>Under applicable data-protection law, you may have the right to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Access:</strong> ask whether we process your personal data and obtain a copy.</li>
          <li><strong>Rectification:</strong> request correction of inaccurate or outdated data.</li>
          <li><strong>Erasure:</strong> request deletion where the data is no longer needed or where applicable consent has been withdrawn.</li>
          <li><strong>Restriction:</strong> request restriction of processing in the circumstances provided by law.</li>
          <li><strong>Portability:</strong> receive data you provided in a structured, commonly used and machine-readable format where applicable.</li>
          <li><strong>Object:</strong> object to processing based on legitimate interests where applicable.</li>
        </ul>
        <p>You can exercise your rights by contacting us at {EMAIL}.</p>

        <p id="account-deletion">
          <strong>Delete your Chvostíkovo customer account:</strong> you can request account
          deletion and deletion of associated personal data without logging in by contacting{" "}
          <a className="font-semibold text-coral underline"
            href={"mailto:" + EMAIL + "?subject=Chvostikovo%20account%20deletion"}>{EMAIL}</a>.
          We will verify the request and erase data that we have no legal reason to retain.
          Statutory records are kept only as long as required by law.
        </p>

        <H2>7. Sharing personal data</H2>
        <p>
          We do not sell customer contacts or share them with other companies for their own advertising.
          Service providers supporting operations include Supabase (authentication and database),
          Vercel (customer portal), GitHub Pages (public website) and, where used, messaging,
          e-mail, SMS and push delivery providers. Website analytics and advertising providers
          may process data according to the applicable cookie choices and legal basis.
          Authorities may receive data where required by law. Applicable GDPR safeguards
          govern transfers outside the European Economic Area.
        </p>

        <H2>8. Data security</H2>
        <p>
          We use appropriate technical and organisational measures to protect personal data in accordance with applicable law.
        </p>

        <H2>9. Cookies</H2>
        <p>
          We use cookies to improve your experience and analyse website traffic. More information is available in our{" "}
          <Link to="/en/cookies" className="font-semibold text-coral underline">Cookie Policy</Link>.
        </p>

        <H2>10. Contact</H2>
        <p>
          If you have questions about personal-data processing, contact us at {EMAIL} or by post at Miškovecká 2, 040 11 Košice, Slovakia.
        </p>
      </div>
    </main>
  );
}
