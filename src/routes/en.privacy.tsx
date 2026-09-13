import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Privacy Policy | Chvostíkovo";
const description = "Privacy policy for the Chvostíkovo dog daycare website in Košice.";
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

      <div className="mt-6 space-y-4 text-forest/85">
        <H2>1. Introduction</H2>
        <p>
          This Privacy Policy explains how we process personal data that you provide through the website chvostikovo.sk.
        </p>
        <p>
          The website operator is Marek Leder – Bellaris, Miškovecká 2, Košice, Company ID: 56 447 001 (the “Operator”).
        </p>

        <H2>2. Personal data we process</H2>
        <p>We may process the following categories of personal data:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Contact details:</strong> name, surname, e-mail address and telephone number.</li>
          <li><strong>Visit data:</strong> IP address, information about activity on our website, cookies, browser and device information.</li>
        </ul>

        <H2>3. Purposes of processing</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Providing services:</strong> to respond to enquiries, communicate with you and provide website functionality.</li>
          <li><strong>Marketing communications:</strong> to send informational or advertising messages where you have given consent.</li>
          <li><strong>Improving our services:</strong> to analyse and improve our services and website.</li>
        </ul>

        <H2>4. Legal basis</H2>
        <p>We process personal data on the basis of:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Consent:</strong> where you have given consent for a specific purpose.</li>
          <li><strong>Performance of a contract:</strong> where processing is necessary to perform a contract with you.</li>
          <li><strong>Legitimate interests:</strong> for example to protect our systems and improve our services.</li>
        </ul>

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

        <H2>7. Sharing personal data</H2>
        <p>
          We do not share your personal data with third parties except where necessary to fulfil our obligations, operate the services we use, or where required by law.
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
