import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "scripts", "product-image-data");
const outputDir = path.join(root, "src", "assets", "products");
const routePath = path.join(root, "src", "routes", "stojan-na-misky-pre-psa.tsx");

await mkdir(outputDir, { recursive: true });

const chunks = (await readdir(dataDir))
  .filter((name) => name.startsWith("stand-dark.") && name.endsWith(".b64"))
  .sort();

if (!chunks.length) {
  throw new Error("Missing CORI AVIF data chunks");
}

const encoded = (
  await Promise.all(chunks.map(async (name) => (await readFile(path.join(dataDir, name), "utf8")).trim()))
).join("");

const image = Buffer.from(encoded, "base64");
const header = image.subarray(0, 32).toString("ascii");

if (image.length < 20_000 || !header.includes("ftypavif")) {
  throw new Error(`Invalid CORI AVIF (${image.length} bytes)`);
}

const outputPath = path.join(outputDir, "stand-cori.avif");
await writeFile(outputPath, image);

const source = await readFile(routePath, "utf8");
const oldImport = '@/assets/products/stand-dark.webp';
const newImport = '@/assets/products/stand-cori.avif';

if (!source.includes(oldImport)) {
  throw new Error("Expected stand-dark.webp import was not found in product route");
}

await writeFile(routePath, source.replace(oldImport, newImport));
console.log(`Restored CORI AVIF: ${image.length} bytes and set it as the main product image.`);
