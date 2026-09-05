// Doplní statický výstup pre GitHub Pages: SPA fallback (404.html) a .nojekyll.
import { copyFile, writeFile, rm } from "node:fs/promises";

const dir = "dist/client";
await copyFile(`${dir}/index.html`, `${dir}/404.html`);
await writeFile(`${dir}/.nojekyll`, "");
// Serverový bundle nie je pre statický hosting potrebný.
await rm("dist/server", { recursive: true, force: true });
console.log("[pages] hotovo: dist/client je pripravený na GitHub Pages");
