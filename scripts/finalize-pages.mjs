// Doplní statický výstup pre GitHub Pages: SPA fallback (404.html) a .nojekyll.
// Zároveň normalizuje dve SEO routy na ich finálny GitHub Pages tvar s lomkou,
// aby canonical/hreflang/structured data neukazovali na URL, ktorá sa musí presmerovať.
import { copyFile, writeFile, rm, readFile, readdir } from "node:fs/promises";
import { extname, join } from "node:path";

const dir = "dist/client";

const seoUrls = [
  "https://chvostikovo.sk/strazenie-psov-kosice",
  "https://chvostikovo.sk/en/dog-daycare-kosice",
];

const textExtensions = new Set([".html", ".js", ".xml"]);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

async function normalizeSeoUrls(folder) {
  const entries = await readdir(folder, { withFileTypes: true });

  for (const entry of entries) {
    const path = join(folder, entry.name);

    if (entry.isDirectory()) {
      await normalizeSeoUrls(path);
      continue;
    }

    if (!textExtensions.has(extname(entry.name))) continue;

    let content = await readFile(path, "utf8");
    let updated = content;

    for (const url of seoUrls) {
      updated = updated.replace(new RegExp(`${escapeRegExp(url)}(?!/)`, "g"), `${url}/`);
    }

    if (updated !== content) {
      await writeFile(path, updated);
    }
  }
}

await normalizeSeoUrls(dir);
await copyFile(`${dir}/index.html`, `${dir}/404.html`);
await writeFile(`${dir}/.nojekyll`, "");
// Serverový bundle nie je pre statický hosting potrebný.
await rm("dist/server", { recursive: true, force: true });
console.log("[pages] hotovo: dist/client je pripravený na GitHub Pages; SEO URL sú normalizované");
