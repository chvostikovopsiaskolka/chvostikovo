import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const productDataDir = path.join(root, "scripts", "product-image-data");
const galleryDataDir = path.join(root, "scripts", "gallery-image-data");
const outputDir = path.join(root, "src", "assets", "products");

await mkdir(outputDir, { recursive: true });

async function restoreImage({ label, dataDir, prefix, output, minBytes = 8_000, expectedBytes }) {
  const dataFiles = await readdir(dataDir);
  const chunks = dataFiles
    .filter((name) => name.startsWith(`${prefix}.`) && name.endsWith(".b64"))
    .sort();

  if (!chunks.length) {
    throw new Error(`Missing ${label} AVIF data chunks`);
  }

  const encoded = (
    await Promise.all(chunks.map(async (name) => (await readFile(path.join(dataDir, name), "utf8")).trim()))
  ).join("");
  const image = Buffer.from(encoded, "base64");
  const header = image.subarray(0, 32).toString("ascii");

  if (
    image.length < minBytes ||
    !header.includes("ftypavif") ||
    (expectedBytes && image.length !== expectedBytes)
  ) {
    throw new Error(`Invalid ${label} AVIF (${image.length} bytes)`);
  }

  await writeFile(path.join(outputDir, output), image);
  console.log(`Restored ${label} AVIF: ${image.length} bytes.`);
}

await restoreImage({
  label: "CORI",
  dataDir: productDataDir,
  prefix: "stand-dark",
  output: "stand-cori.avif",
  minBytes: 20_000,
});
await restoreImage({
  label: "WOODY",
  dataDir: productDataDir,
  prefix: "stand-woody",
  output: "stand-woody.avif",
  minBytes: 15_000,
});
await restoreImage({
  label: "MIA",
  dataDir: productDataDir,
  prefix: "stand-mia",
  output: "stand-mia.avif",
  minBytes: 20_000,
});
await restoreImage({
  label: "MLYNČEK",
  dataDir: galleryDataDir,
  prefix: "stand-mlyncek",
  output: "stand-mlyncek.avif",
  expectedBytes: 11_910,
});
await restoreImage({
  label: "ARON",
  dataDir: galleryDataDir,
  prefix: "stand-aron",
  output: "stand-aron.avif",
  expectedBytes: 9_162,
});
await restoreImage({
  label: "LOKI",
  dataDir: galleryDataDir,
  prefix: "stand-loki",
  output: "stand-loki.avif",
  expectedBytes: 10_841,
});
await restoreImage({
  label: "PLANÉTKY",
  dataDir: galleryDataDir,
  prefix: "stand-planetky",
  output: "stand-planetky.avif",
  expectedBytes: 9_735,
});
await restoreImage({
  label: "ALOY",
  dataDir: galleryDataDir,
  prefix: "stand-aloy",
  output: "stand-aloy.avif",
  expectedBytes: 33_594,
});

const routePath = path.join(root, "src", "routes", "stojan-na-misky-pre-psa.tsx");
let routeSource = await readFile(routePath, "utf8");

const routeImportReplacements = [
  ['@/assets/products/stand-dark.webp', '@/assets/products/stand-cori.avif'],
  ['@/assets/products/stand-white.webp', '@/assets/products/stand-woody.avif'],
  ['@/assets/products/stand-small-mia.webp', '@/assets/products/stand-mia.avif'],
];

for (const [oldImport, newImport] of routeImportReplacements) {
  if (!routeSource.includes(oldImport)) {
    throw new Error(`Expected ${oldImport} import was not found in product route`);
  }
  routeSource = routeSource.replace(oldImport, newImport);
}

const galleryImportAnchor = 'import standMia from "@/assets/products/stand-mia.avif";';
const galleryImports = `${galleryImportAnchor}\nimport standMlyncek from "@/assets/products/stand-mlyncek.avif";\nimport standAron from "@/assets/products/stand-aron.avif";\nimport standLoki from "@/assets/products/stand-loki.avif";\nimport standPlanetky from "@/assets/products/stand-planetky.avif";\nimport standAloy from "@/assets/products/stand-aloy.avif";`;

if (!routeSource.includes(galleryImportAnchor)) {
  throw new Error("Expected MIA import anchor was not found in product route");
}
routeSource = routeSource.replace(galleryImportAnchor, galleryImports);

const oldRealizations = "const REALIZATIONS = GALLERY;";
const newRealizations = `const REALIZATIONS = [\n  ...GALLERY,\n  {\n    src: standMlyncek,\n    alt: "Svetlý drevený stojan na misky pre psa MLYNČEK",\n    position: "50% 58%",\n  },\n  {\n    src: standAron,\n    alt: "Tmavý drevený stojan na misky pre psa ARON",\n    position: "50% 58%",\n  },\n  {\n    src: standLoki,\n    alt: "Tmavý drevený stojan na misky pre psa LOKI",\n    position: "50% 56%",\n  },\n  {\n    src: standPlanetky,\n    alt: "Biely drevený stojan na misky pre psa PLANÉTKY",\n    position: "50% 58%",\n  },\n  {\n    src: standAloy,\n    alt: "Tmavý drevený stojan na misky pre psa ALOY",\n    position: "50% 55%",\n  },\n];`;

if (!routeSource.includes(oldRealizations)) {
  throw new Error("Expected REALIZATIONS declaration was not found in product route");
}
routeSource = routeSource.replace(oldRealizations, newRealizations);

const oldHeroSpacing =
  'className="scroll-mt-24 relative overflow-hidden pt-28 pb-14 sm:pt-32 sm:pb-20"';
const newHeroSpacing =
  'className="scroll-mt-24 relative overflow-hidden pt-28 pb-6 sm:pt-32 sm:pb-14"';
if (!routeSource.includes(oldHeroSpacing)) {
  throw new Error("Expected hero spacing classes were not found in product route");
}
routeSource = routeSource.replace(oldHeroSpacing, newHeroSpacing);

const oldSizesSection = '<section className="bg-secondary/50 py-14 sm:py-20">';
const newSizesSection = '<section className="bg-secondary/50 pt-8 pb-14 sm:py-20">';
if (!routeSource.includes(oldSizesSection)) {
  throw new Error("Expected sizes section spacing was not found in product route");
}
routeSource = routeSource.replace(oldSizesSection, newSizesSection);

const oldRealizationsHeading = `            <div className="text-center">\n              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">\n                Naše realizácie\n              </p>\n              <h2 className="section-title mt-2 text-3xl sm:text-4xl">\n                Spokojní štvornohí klienti\n              </h2>\n              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">\n                Niekoľko hotových prevedení. Ďalšie farby a realizácie budeme postupne dopĺňať.\n              </p>\n            </div>\n            <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">`;
const newRealizationsHeading = `            <div className="text-center">\n              <h2 className="section-title text-3xl sm:text-4xl">\n                Spokojní štvornohí klienti\n              </h2>\n            </div>\n            <div className="mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">`;

if (!routeSource.includes(oldRealizationsHeading)) {
  throw new Error("Expected realizations heading block was not found in product route");
}
routeSource = routeSource.replace(oldRealizationsHeading, newRealizationsHeading);

await writeFile(routePath, routeSource);

const listingReplacements = [
  {
    file: "src/components/site/ProductSection.tsx",
    oldImport: '@/assets/products/stand-small-mia.webp',
    newImport: '@/assets/products/stand-mia.avif',
  },
  {
    file: "src/routes/produkty.tsx",
    oldImport: '@/assets/products/stand-small-mia.webp',
    newImport: '@/assets/products/stand-mia.avif',
  },
];

for (const item of listingReplacements) {
  const filePath = path.join(root, item.file);
  let source = await readFile(filePath, "utf8");
  if (!source.includes(item.oldImport)) {
    throw new Error(`Expected ${item.oldImport} import was not found in ${item.file}`);
  }
  source = source.replace(item.oldImport, item.newImport);
  await writeFile(filePath, source);
}

const englishReviewsPath = path.join(root, "src", "routes", "en.dog-daycare-kosice.tsx");
let englishReviewsSource = await readFile(englishReviewsPath, "utf8");
const oldEnglishReviewsCopy =
  '<p className="mx-auto mt-3 max-w-2xl text-sm text-forest/65">Selected reviews translated from Slovak.</p>';
const newEnglishReviewsCopy = `<p className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-forest/65">\n                <span className="tracking-[0.12em] text-coral" aria-hidden="true">★★★★★</span>\n                <span>5.0 · 5-star reviews from 41 customers on Google</span>\n              </p>`;

if (!englishReviewsSource.includes(oldEnglishReviewsCopy)) {
  throw new Error("Expected English reviews subtitle was not found");
}
englishReviewsSource = englishReviewsSource.replace(oldEnglishReviewsCopy, newEnglishReviewsCopy);
await writeFile(englishReviewsPath, englishReviewsSource);

console.log(
  "Product images restored; realizations extended with MLYNČEK / ARON / LOKI / PLANÉTKY / ALOY; mobile spacing tightened; English Google review summary updated.",
);
