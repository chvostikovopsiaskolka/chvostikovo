// Statický build pre GitHub Pages: `bun run build:pages`.
// Neobsahuje Lovable/Nitro server runtime — výsledkom sú čisté statické súbory.
// Produkčný build pre Lovable hosting zostáva nezmenený vo `vite.config.ts`.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  // Žiadny server bundle — iba statické HTML/JS/CSS.
  nitro: false,
  tanstackStart: {
    // SPA + prerender: každá routa dostane vlastný statický HTML súbor,
    // takže priame otvorenie /cookies funguje aj bez servera.
    spa: { enabled: true },
    prerender: {
      enabled: true,
      crawlLinks: false,
    },
    pages: [{ path: "/" }, { path: "/cookies" }, { path: "/ochrana-osobnych-udajov" }],
  },
  vite: {
    // Ak by web bežal na https://<user>.github.io/<repo>/, nastav BASE_PATH=/<repo>/.
    base: process.env["BASE_PATH"] ?? "/",
  },
});
