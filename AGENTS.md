<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Chvostíkovo PWA icon rule

Before changing the PWA/home-screen icon for either the admin app or customer portal, read `system/PWA_ICON.md`.

The known-good icon is the **exact admin asset `Store-v2.png` (500x500 PNG)**. Reuse that exact asset/bytes for the customer portal as well. Do not generate, approximate, or substitute a different icon unless the user explicitly asks for a new design.

For the customer portal, the production solution confirmed working on 2026-09-15 serves the same `Store-v2.png` content through the existing same-origin icon route and uses it in the manifest/iOS icon path. Verify the actual iPhone **Add to Home Screen** preview before considering icon work complete.

## Mandatory project context before changes

This is a **public repository**. This file intentionally contains only safe, high-level
instructions. It is NOT the full operating specification of Chvostíkovo.

Before changing behavior, content, styles, tracking, forms, deployment, or related
systems, an agent with authorized access MUST:

1. Read the current **"Chvostíkovo – 00 Hlavný prehľad a rozcestník"** from
   the connected Google Drive, then read the relevant specifications:
   **01 Web a SEO**, **02 Zákaznícka PWA**, **03 Admin**,
   **04 Marketing**, **05 Backend a integrácie**, and **07 História zmien**
   for the affected systems. Read **06 Register vízií** when the request
   concerns an idea, vision, or previous decision. Access those documents
   through the authorized Drive connector; DO NOT guess document contents,
   replicate private documents into GitHub, or assume chat memory is complete.
2. Distinguish **verified production** from history, proposed designs,
   pending deployments, tests, and cancelled approaches. A successful commit
   or deployment status alone does not prove that the feature works in production.
   Explicit recent user decisions supersede older proposals.
3. Inspect the current remote branch/commit, actual affected files, dependencies,
   deployed version, and API/database permissions where relevant. Identify
   the intended user-facing outcome and acceptance criteria.
4. Create or identify a reproducible rollback (commit, immutable branch or
   appropriate system snapshot) BEFORE modifying production-connected code.
   Preserve published Git history; do not force-push, rewrite history,
   overwrite stable snapshots, or silently swap deployment paths.
5. Make the smallest isolated change. No unrelated refactors, new tools,
   extra requests to backend services, unapproved marketing changes, or
   redesigns while repairing a defect.
6. Test relevant desktop and mobile widths, iOS Safari and Android/Chrome
   behavior, keyboard/accessibility, performance, empty/error states,
   navigation and links. For web/forms also verify iOS/Android autofill,
   validation, failure recovery, end-to-end delivery, SEO/EN where relevant,
   consent and accurate analytics attribution. Never inflate live leads with
   test submissions.
7. Deploy ONLY explicitly requested components through the correct pipeline;
   independently verify the result on the live URL before reporting it LIVE.
   Update the EXISTING section of each affected Drive document, update the
   overview in 00, and add ONE release/test entry to 07 in the same task
   where applicable. Read back documentation writes and report any failure.
8. If authorized Drive access, a current production snapshot, a safe rollback,
   or required permissions are missing, **stop before changing or deploying
   production behavior**, state the blocker clearly, and request access or
   provide a reviewable proposal. Never invent verification.

## Scope, privacy and operational safeguards

- Repository `main` contains the marketing website and its GitHub Pages
  build. Customer PWA, administration and backend are separate deployment
  paths even if they share a repository or integration. Check the intended
  branch and deployment before acting; NEVER deploy one to fix another.
- Customer data, credentials, tokens, staff-only records, private architecture,
  full production tables, and detailed security/rollback internals must not
  be committed to this public repository, issues or prompts.
- The Chvostíkovo System mentioned in historical material is retired.
  Do not revive or synchronize it.
- A new idea in 06 is not permission to build or launch it.
- For a documentation-only change, do not claim the application was tested
  or deployed. Preserve a reversible Git commit and label status accurately.

## Web-focused quality baseline (not a substitute for document 01)

- The web must clearly explain the real service and direct people to a
  genuine, accessible inquiry/contact action. Use verified prices,
  eligibility and business information only.
- Maintain semantic headings, meaningful titles/descriptions, appropriate
  canonical/hreflang/robots/sitemap, internal links, accessible focus and
  touch targets, responsive imagery, stable layout and reasonable load cost.
- Contact forms must accept both manually typed values and mobile autofill;
  correctly separate dog breed and weight, validate on server as well as
  client, avoid logging sensitive payloads, and preserve input when sending
  fails. Verify tracking does not double-count or manufacture conversions.
- Do not promise Google rankings, customer numbers or results without
  dated and independently validated evidence.

## Source of truth and limits

Repository files document implementation; the authorized Drive specifications
document operational decisions; production APIs and live artifacts establish
what actually runs. In case of conflict, check the latest explicit decision
and report the discrepancy instead of silently choosing one.

These rules cannot by themselves force an AI tool to connect to Drive.
If the connected agent lacks Drive access, it MUST acknowledge that
limitation and must not treat this public `AGENTS.md` as a complete specification.
