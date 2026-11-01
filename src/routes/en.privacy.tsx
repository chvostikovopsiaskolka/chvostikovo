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

        <section id="account-deletion" aria-labelledby="account-deletion-heading" className="scroll-mt-6 space-y-3">
          <h3 id="account-deletion-heading" className="font-display text-lg font-bold text-forest">
            Delete your Chvostíkovo customer account
          </h3>
          <p>
            You can request deletion of your Chvostíkovo customer app account and associated
            personal data without signing in. Email{" "}
            <a className="font-semibold text-coral underline"
              href={"mailto:" + EMAIL + "?subject=Chvostikovo%20account%20deletion"}>{EMAIL}</a>{" "}
            with the subject “Chvostíkovo account deletion” and include the email address
            registered with your account. Do not send your password or identity documents.
            We may securely verify account ownership.
          </p>
          <p><strong>Data removed:</strong> after verification, we delete the login account
            and information tied exclusively to it when no legal retention basis remains.
            This can include contact and authentication information, notification tokens,
            personal messages, uploaded dog photos or vaccination documents, and reservations.
            For dogs with multiple owners, we also respect the rights of the other owners
            and any ongoing care arrangements.
          </p>
          <p><strong>Data retained and retention:</strong> mandatory accounting documents
            and records are generally retained for <strong>10 years following the year
            they relate to</strong> under Section 35 of Slovak Act No. 431/2002.
            Information needed for outstanding payments, complaints or legal claims may
            be retained only for the applicable statutory period or while the matter is pending.
            We will explain any specific exception and its retention period when handling
            your request. This does not mean keeping the entire active customer profile.
          </p>
          <p>
            We respond without undue delay, generally within one month under the GDPR.
            The request is reviewed and verified; clicking the link does not immediately
            or automatically delete the account.
          </p>
        </section>

        <H2>7. Sharing personal data</H2>
        <p>
          We do not sell customer contacts or share them with other companies for their own advertising.
          To operate the website and customer app, authorised service providers may process
          personal data to the extent necessary. These include providers of website and app
          hosting, database infrastructure, account authentication and security, file storage,
          e-mail, SMS and push delivery, and technical diagnostics. Website analytics and
          advertising service providers may also process data in line with the applicable
          legal basis and privacy settings. We may disclose data to competent authorities
          where required by law. Where data is transferred outside the European Economic Area,
          appropriate safeguards under the GDPR apply.
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
