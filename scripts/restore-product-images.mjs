import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataDir = path.join(root, "scripts", "product-image-data");
const outputDir = path.join(root, "src", "assets", "products");

const images = [
  ["stand-dark", "stand-dark.avif"],
  ["stand-light", "stand-light.avif"],
  ["stand-small-mia", "stand-small-mia.avif"],
  ["stand-white", "stand-white.avif"],
];

await mkdir(outputDir, { recursive: true });
const availableFiles = await readdir(dataDir);

for (const [prefix, outputName] of images) {
  const chunks = availableFiles
    .filter((name) => name.startsWith(`${prefix}.`) && name.endsWith(".b64"))
    .sort();

  if (!chunks.length) {
    throw new Error(`Missing image data chunks for ${prefix}`);
  }

  const encodedParts = await Promise.all(
    chunks.map(async (name) => (await readFile(path.join(dataDir, name), "utf8")).trim()),
  );

  const image = Buffer.from(encodedParts.join(""), "base64");
  const header = image.subarray(0, 32).toString("ascii");

  if (image.length < 20_000 || !header.includes("ftypavif")) {
    throw new Error(`Invalid reconstructed AVIF image ${outputName} (${image.length} bytes)`);
  }

  await writeFile(path.join(outputDir, outputName), image);
  console.log(`Restored ${outputName}: ${image.length} bytes`);
}
