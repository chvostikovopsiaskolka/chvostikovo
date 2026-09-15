import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "scripts", "product-image-data");
const outputDir = path.join(root, "src", "assets", "products");

await mkdir(outputDir, { recursive: true });

const images = [
  { label: "CORI", prefix: "stand-dark", output: "stand-cori.avif", minBytes: 20_000 },
  { label: "WOODY", prefix: "stand-woody", output: "stand-woody.avif", minBytes: 15_000 },
  { label: "MIA", prefix: "stand-mia", output: "stand-mia.avif", minBytes: 20_000 },
];

const dataFiles = await readdir(dataDir);

for (const definition of images) {
  const chunks = dataFiles
    .filter((name) => name.startsWith(`${definition.prefix}.`) && name.endsWith(".b64"))
    .sort();

  if (!chunks.length) {
    throw new Error(`Missing ${definition.label} AVIF data chunks`);
  }

  const encoded = (
    await Promise.all(chunks.map(async (name) => (await readFile(path.join(dataDir, name), "utf8")).trim()))
  ).join("");
  const image = Buffer.from(encoded, "base64");
  const header = image.subarray(0, 32).toString("ascii");

  if (image.length < definition.minBytes || !header.includes("ftypavif")) {
    throw new Error(`Invalid ${definition.label} AVIF (${image.length} bytes)`);
  }

  await writeFile(path.join(outputDir, definition.output), image);
  console.log(`Restored ${definition.label} AVIF: ${image.length} bytes.`);
}

const sourceReplacements = [
  {
    file: "src/routes/stojan-na-misky-pre-psa.tsx",
    replacements: [
      ['@/assets/products/stand-dark.webp', '@/assets/products/stand-cori.avif'],
      ['@/assets/products/stand-white.webp', '@/assets/products/stand-woody.avif'],
      ['@/assets/products/stand-small-mia.webp', '@/assets/products/stand-mia.avif'],
    ],
  },
  {
    file: "src/components/site/ProductSection.tsx",
    replacements: [['@/assets/products/stand-small-mia.webp', '@/assets/products/stand-mia.avif']],
  },
  {
    file: "src/routes/produkty.tsx",
    replacements: [['@/assets/products/stand-small-mia.webp', '@/assets/products/stand-mia.avif']],
  },
];

for (const item of sourceReplacements) {
  const filePath = path.join(root, item.file);
  let source = await readFile(filePath, "utf8");

  for (const [oldImport, newImport] of item.replacements) {
    if (!source.includes(oldImport)) {
      throw new Error(`Expected ${oldImport} import was not found in ${item.file}`);
    }
    source = source.replace(oldImport, newImport);
  }

  await writeFile(filePath, source);
}

console.log("Product images set to CORI / WOODY / MIA; MIA is used for listing thumbnails.");
