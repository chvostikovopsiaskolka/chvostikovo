import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import "./restore-daycare-carousel.mjs";

const root = process.cwd();
const productDataDir = path.join(root, "scripts", "product-image-data");
const galleryDataDir = path.join(root, "scripts", "gallery-image-data");
const siteDataDir = path.join(root, "scripts", "site-image-data");
const outputDir = path.join(root, "src", "assets", "products");
const siteOutputDir = path.join(root, "src", "assets");

await mkdir(outputDir, { recursive: true });
await mkdir(siteOutputDir, { recursive: true });

async function restoreImage({
  label,
  dataDir,
  prefix,
  output,
  minBytes = 8_000,
  expectedBytes,
  expectedSha256,
  targetDir = outputDir,
  format = "avif",
}) {
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
  const validFormat =
    format === "webp"
      ? header.startsWith("RIFF") && header.includes("WEBP")
      : header.includes("ftypavif");

  if (
    image.length < minBytes ||
    !validFormat ||
    (expectedBytes && image.length !== expectedBytes)
  ) {
    throw new Error(`Invalid ${label} ${format.toUpperCase()} (${image.length} bytes)`);
  }

  if (expectedSha256 && createHash("sha256").update(image).digest("hex") !== expectedSha256) {
    throw new Error(`Checksum mismatch restoring ${label}: ${output}`);
  }

  await writeFile(path.join(targetDir, output), image);
  console.log(`Restored ${label} ${format.toUpperCase()}: ${image.length} bytes.`);
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

await restoreImage({
  label: "ŠKÔLKÁRI",
  dataDir: siteDataDir,
  prefix: "skolkari-green-exact",
  output: "skolkari-lineup.webp",
  expectedBytes: 297_522,
  minBytes: 250_000,
  targetDir: siteOutputDir,
  format: "webp",
});

await restoreImage({
  label: "PUPPY HERO",
  dataDir: siteDataDir,
  prefix: "puppy-hero",
  output: "puppy-hero.webp",
  expectedBytes: 101_174,
  minBytes: 90_000,
  targetDir: siteOutputDir,
  format: "webp",
});
await restoreImage({
  label: "NEW DAYCARE PHOTO 01",
  dataDir: galleryDataDir,
  prefix: "skolkari-novi-01",
  output: "skolkari-novi-01.avif",
  expectedBytes: 48328,
  expectedSha256: "e52ce29c3850c9531dc867d767300c3563ccf370e096878705a659dcf5e7dcd2",
  minBytes: 20_000,
  targetDir: siteOutputDir,
});
await restoreImage({
  label: "NEW DAYCARE PHOTO 02",
  dataDir: galleryDataDir,
  prefix: "skolkari-novi-02",
  output: "skolkari-novi-02.avif",
  expectedBytes: 51178,
  expectedSha256: "b0bc0fd3d7ae51f0107d5170732aa60639abc6d70d8e36d17d1f34f9ed60be80",
  minBytes: 20_000,
  targetDir: siteOutputDir,
});
await restoreImage({
  label: "NEW DAYCARE PHOTO 03",
  dataDir: galleryDataDir,
  prefix: "skolkari-novi-03",
  output: "skolkari-novi-03.avif",
  expectedBytes: 32957,
  expectedSha256: "30cab4374faadfb249f9aca6372a22e73bf29af86b0bb3929165e331fc1a7830",
  minBytes: 20_000,
  targetDir: siteOutputDir,
});
await restoreImage({
  label: "NEW DAYCARE PHOTO 04",
  dataDir: galleryDataDir,
  prefix: "skolkari-novi-04",
  output: "skolkari-novi-04.avif",
  expectedBytes: 29345,
  expectedSha256: "acb1b591b9806794a787dc0f6a8460c9e1bbb8a34adfc34474d807b58178af23",
  minBytes: 20_000,
  targetDir: siteOutputDir,
});

await restoreImage({
  label: "FRIENDSHIP FEATURE",
  dataDir: siteDataDir,
  prefix: "friendship-feature",
  output: "friendship-feature.avif",
  expectedBytes: 151_549,
  expectedSha256: "6d347a567cdcf007fcffd7346e7ff5c1a30801e487b49c82542cdbe05f3b9a73",
  minBytes: 100_000,
  targetDir: siteOutputDir,
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

const dialogImportAnchor = 'import { Collapse } from "@/components/site/Collapse";';
const dialogImports = `${dialogImportAnchor}\nimport { ContentDialog } from "@/components/site/ContentDialog";`;
if (!routeSource.includes(dialogImportAnchor)) {
  throw new Error("Expected Collapse import anchor was not found in product route");
}
routeSource = routeSource.replace(dialogImportAnchor, dialogImports);

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

const oldOpenOrderOptions = `  function openOrderOptions() {\n    setOrderOpen(true);\n    window.setTimeout(() => {\n      document\n        .getElementById("objednavka-stojana")\n        ?.scrollIntoView({ behavior: "smooth", block: "center" });\n    }, 50);\n  }`;
const newOpenOrderOptions = `  function openOrderOptions() {\n    setOrderOpen(true);\n  }`;
if (!routeSource.includes(oldOpenOrderOptions)) {
  throw new Error("Expected openOrderOptions function was not found in product route");
}
routeSource = routeSource.replace(oldOpenOrderOptions, newOpenOrderOptions);

const oldInquiryTrigger = `                    onClick={() => setOrderOpen((open) => !open)}\n                    aria-expanded={orderOpen}\n                    aria-controls="moznosti-objednavky-stojana"`;
const newInquiryTrigger = `                    onClick={openOrderOptions}\n                    aria-haspopup="dialog"`;
if (!routeSource.includes(oldInquiryTrigger)) {
  throw new Error("Expected stand inquiry trigger was not found in product route");
}
routeSource = routeSource.replace(oldInquiryTrigger, newInquiryTrigger);

const oldInquiryIcon = `                    <ChevronDown\n                      className={\`size-5 shrink-0 text-forest/65 transition-transform \${orderOpen ? "rotate-180" : ""}\`}\n                    />`;
const newInquiryIcon = `                    <ChevronRight className="size-5 shrink-0 text-forest/65" />`;
if (!routeSource.includes(oldInquiryIcon)) {
  throw new Error("Expected stand inquiry chevron was not found in product route");
}
routeSource = routeSource.replace(oldInquiryIcon, newInquiryIcon);

const oldInquiryOpen = `                  {orderOpen && (\n                    <div\n                      id="moznosti-objednavky-stojana"\n                      className="mt-3 rounded-4xl bg-card p-5 shadow-soft sm:p-6"\n                    >`;
const newInquiryOpen = `                  <ContentDialog\n                    open={orderOpen}\n                    onOpenChange={setOrderOpen}\n                    title="Mám záujem o stojan"\n                    subtitle="Vyberte rozmer, farbu, výšku a personalizáciu"\n                  >`;
if (!routeSource.includes(oldInquiryOpen)) {
  throw new Error("Expected inline stand inquiry opening was not found in product route");
}
routeSource = routeSource.replace(oldInquiryOpen, newInquiryOpen);

const oldInquiryClose = `                      )}\n                    </div>\n                  )}\n                </div>\n              </div>`;
const newInquiryClose = `                      )}\n                  </ContentDialog>\n                </div>\n              </div>`;
if (!routeSource.includes(oldInquiryClose)) {
  throw new Error("Expected inline stand inquiry closing was not found in product route");
}
routeSource = routeSource.replace(oldInquiryClose, newInquiryClose);

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

if (englishReviewsSource.includes(oldEnglishReviewsCopy)) {
  englishReviewsSource = englishReviewsSource.replace(oldEnglishReviewsCopy, newEnglishReviewsCopy);
  await writeFile(englishReviewsPath, englishReviewsSource);
} else if (
  englishReviewsSource.includes("5.0 on Google") ||
  englishReviewsSource.includes("5-star reviews")
) {
  console.log("English Google review summary is already current.");
} else {
  throw new Error("Expected English reviews summary was not found");
}

console.log(
  "Product images restored; realizations extended; stand inquiry moved to modal; English Google review summary updated.",
);
