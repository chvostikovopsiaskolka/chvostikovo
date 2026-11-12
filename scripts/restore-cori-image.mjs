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
  preferCommittedAsset = false,
}) {
  // Product-realization AVIF files are versioned Git assets.
  // Never replace them with old lower-resolution Base64 chunks.
  if (preferCommittedAsset) {
    if (!expectedBytes || !expectedSha256) throw new Error("Missing strict HQ image verification values: " + output);
    const asset = await readFile(path.join(targetDir, output));
    const validFormat = asset.subarray(0, 32).toString("ascii").includes("ftypavif");
    if (!validFormat || asset.length !== expectedBytes || createHash("sha256").update(asset).digest("hex") !== expectedSha256) {
      throw new Error("High-quality image missing, invalid or changed: " + output);
    }
    console.log("Verified committed HQ asset: " + output + " (" + asset.length + " bytes)");
    return;
  }
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
  expectedBytes: 225481,
  expectedSha256: "5418818122a4b9512237850ab39e31dd79c60919c868f89894e0404dcfaa18a5",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "ARON",
  dataDir: galleryDataDir,
  prefix: "stand-aron",
  output: "stand-aron.avif",
  expectedBytes: 56129,
  expectedSha256: "b29ad10c97702f1682fbb9387439cd4d769f34077ee59292af4e0199ad279806",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "LOKI",
  dataDir: galleryDataDir,
  prefix: "stand-loki",
  output: "stand-loki.avif",
  expectedBytes: 257304,
  expectedSha256: "65b5189373d15fffef3ebfdcb28bda749b7ad2fe5d8268cd87f881b02dcfdc31",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "PLANÉTKY",
  dataDir: galleryDataDir,
  prefix: "stand-planetky",
  output: "stand-planetky.avif",
  expectedBytes: 146187,
  expectedSha256: "30660f59b79ea3e6faae2ea895af27690ac041b5ea8b6b8fad2b9700e707638d",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "ALOY",
  dataDir: galleryDataDir,
  prefix: "stand-aloy",
  output: "stand-aloy.avif",
  expectedBytes: 156373,
  expectedSha256: "fa8fcfd3abd5e9a04a37b657a03466d5668b25ad76de01046ba20a5800dc7774",
  preferCommittedAsset: true,
});

await restoreImage({
  label: "STOJAN V PRAXI",
  dataDir: galleryDataDir,
  prefix: "stand-psik-pri-miskach",
  output: "stand-psik-pri-miskach.avif",
  expectedBytes: 140408,
  expectedSha256: "907f4f336faf89f77e585928400e7c53ec592f65e71c38eb306f0d4742a17962",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "MAYA",
  dataDir: galleryDataDir,
  prefix: "stand-maya",
  output: "stand-maya.avif",
  expectedBytes: 45938,
  expectedSha256: "14b868c2975e7842285efb2a876f444a5afe9efd8cf7344c93ab90df9c361bb3",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "GAEL",
  dataDir: galleryDataDir,
  prefix: "stand-gael",
  output: "stand-gael.avif",
  expectedBytes: 245715,
  expectedSha256: "51fea63f2d4a85941a711f516b91d585ff76ad0462af5b69a4c5343c6691e73a",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "LARA",
  dataDir: galleryDataDir,
  prefix: "stand-lara",
  output: "stand-lara.avif",
  expectedBytes: 327907,
  expectedSha256: "3c04913843458c2c4940913eeae4b78137f1571c6fd7fdeed5b995243c526756",
  preferCommittedAsset: true,
});
await restoreImage({
  label: "SAFIRA",
  dataDir: galleryDataDir,
  prefix: "stand-safira",
  output: "stand-safira.avif",
  expectedBytes: 265948,
  expectedSha256: "38d463476a00dae07ff81cf605aac1d57c42dc80705837f3af62860e87a74fad",
  preferCommittedAsset: true,
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

// The product route now owns its stable FormDialog directly; no synthetic injection.
if (!routeSource.includes('import { FormDialog } from "@/components/site/FormDialog";')) {
  throw new Error("Product inquiry must use the existing FormDialog");
}

const oldRealizations = "const REALIZATIONS = GALLERY;";
const newRealizations = `const REALIZATIONS = [\n  ...GALLERY,\n  {\n    src: standMlyncek,\n    alt: "Svetlý drevený stojan na misky pre psa MLYNČEK",\n    position: "50% 58%",\n  },\n  {\n    src: standAron,\n    alt: "Tmavý drevený stojan na misky pre psa ARON",\n    position: "50% 58%",\n  },\n  {\n    src: standLoki,\n    alt: "Tmavý drevený stojan na misky pre psa LOKI",\n    position: "50% 56%",\n  },\n  {\n    src: standPlanetky,\n    alt: "Biely drevený stojan na misky pre psa PLANÉTKY",\n    position: "50% 58%",\n  },\n  {\n    src: standAloy,\n    alt: "Tmavý drevený stojan na misky pre psa ALOY",\n    position: "50% 55%",\n  },\n];`;

if (routeSource.includes(oldRealizations)) {
  routeSource = routeSource.replace(oldRealizations, newRealizations);
} else if (routeSource.includes("<StandGalleryLoop />")) {
  // New gallery component already uses restored AVIF photos and loops automatically.
  console.log("Autoplay stand gallery present; no static REALIZATIONS injection needed.");
} else {
  throw new Error("Neither legacy realizations nor the approved autoplay gallery is present");
}

// S/M/L cards and the three-step modal are maintained in React source.
// Do not mutate them at build time; retain the image restoration only.

const oldRealizationsHeading = `            <div className="text-center">\n              <p className="font-display text-sm font-semibold tracking-wide text-coral uppercase">\n                Naše realizácie\n              </p>\n              <h2 className="section-title mt-2 text-3xl sm:text-4xl">\n                Spokojní štvornohí klienti\n              </h2>\n              <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-forest/75">\n                Niekoľko hotových prevedení. Ďalšie farby a realizácie budeme postupne dopĺňať.\n              </p>\n            </div>\n            <div className="mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">`;
const newRealizationsHeading = `            <div className="text-center">\n              <h2 className="section-title text-3xl sm:text-4xl">\n                Spokojní štvornohí klienti\n              </h2>\n            </div>\n            <div className="mt-7 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">`;

if (routeSource.includes(oldRealizationsHeading)) {
  routeSource = routeSource.replace(oldRealizationsHeading, newRealizationsHeading);
} else if (routeSource.includes("<StandGalleryLoop />")) {
  // The maintained title is already followed by the reusable moving carousel.
  console.log("Autoplay stand realizations preserve the current heading.");
} else {
  throw new Error("Stand gallery heading has no approved static or autoplay layout");
}

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
  if (source.includes(item.oldImport)) {
    source = source.replace(item.oldImport, item.newImport);
    await writeFile(filePath, source);
  } else if (source.includes(item.newImport)) {
    // This page already imports the restored original AVIF directly.
    console.log(`Sharp stand image already imported in ${item.file}`);
  } else if (item.file === "src/routes/produkty.tsx" &&
    source.includes('import { ProductCatalogCarousel } from "@/components/site/ProductCatalogCarousel";')) {
    const catalogSource = await readFile(path.join(root, "src/components/site/ProductCatalogCarousel.tsx"), "utf8");
    if (!catalogSource.includes(item.newImport)) {
      throw new Error("Product catalog component must use sharp original MIA AVIF");
    }
    console.log("Product catalog component uses restored original MIA AVIF");
  } else {
    throw new Error(`Neither expected stand image import was found in ${item.file}`);
  }
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
