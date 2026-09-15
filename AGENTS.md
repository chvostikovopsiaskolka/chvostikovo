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
