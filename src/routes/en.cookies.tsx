import { createFileRoute, Link } from "@tanstack/react-router";
import { EMAIL } from "@/content/site";

const title = "Cookie Policy | Chvostíkovo";
const description = "Cookie policy for the Chvostíkovo dog daycare website in Košice.";
const BASE_URL = "https://chvostikovo.sk";
const PAGE_URL = `${BASE_URL}/en/cookies`;

export const Route = createFileRoute("/en/cookies")({
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
  component: EnglishCookies,
});

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="pt-3 font-display text-xl font-bold text-forest">{children}</h2>;
}

function EnglishCookies() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <Link to="/en/dog-daycare-kosice" className="font-display text-sm font-semibold text-coral">
        ← Back to the English page
      </Link>
      <h1 className="section-title mt-4 text-3xl sm:text-4xl">Cookie Policy</h1>

      <div className="mt-6 space-y-4 text-forest/85">
        <H2>1. What are cookies?</H2>
        <p>
          Cookies are small text files stored on your device when you visit our website. They help us
          keep the website working correctly, analyse traffic and improve your experience.
        </p>

        <H2>2. Types of cookies we use</H2>
        <ul className="list-disc space-y-2 pl-5">
          <li><strong>Necessary cookies:</strong> required for the correct and secure operation of the website. They cannot be disabled through our cookie settings because they are needed for basic website functions.</li>
          <li><strong>Analytics cookies:</strong> help us understand how visitors use the website and improve it. They are used only with your consent.</li>
          <li><strong>Functional cookies:</strong> allow the website to provide additional functions and remember certain settings. Where consent is required, they are used only after you give it.</li>
          <li><strong>Advertising cookies:</strong> are used to measure advertising performance and provide more relevant advertising content. They are used only with your consent.</li>
        </ul>
        <p>
          <strong>Third-party services:</strong> We use third-party services, in particular Google Analytics and Meta Pixel, to analyse website traffic and measure advertising performance. These services are activated only after the relevant consent has been given.
        </p>

        <H2>3. Consent and cookie settings</H2>
        <p>
          On your first visit, you can choose which optional cookies you allow through the cookie banner. Necessary cookies are used without consent because they are required for the basic operation of the website. Optional analytics, functional and advertising cookies are used only after consent where required.
        </p>
        <p>You can refuse optional cookies without affecting the basic use of our website.</p>

        <H2>4. Changing or withdrawing consent</H2>
        <p>
          You can change your cookie settings or withdraw your consent at any time by using the “Cookie settings” link in the footer. You can also manage or delete cookies through your browser settings.
        </p>

        <H2>5. Cookie retention</H2>
        <p>
          The retention period depends on the type, purpose and provider of each cookie. Some cookies are deleted when you close your browser, while others may remain stored on your device for a defined period.
        </p>

        <H2>6. Changes to this policy</H2>
        <p>
          We may update this policy when technologies, third-party services or legal requirements change. The current version will always be available on this website.
        </p>

        <H2>7. Contact</H2>
        <p>If you have questions about cookies, contact us at {EMAIL}.</p>
      </div>
    </main>
  );
}
