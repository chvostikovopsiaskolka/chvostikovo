import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const sourceDir = "scripts/product-image-data-v2";
const targetDir = "src/assets/products";

const images = {
  dark: "stand-dark.webp",
  light: "stand-light.webp",
  white: "stand-white.webp",
  mia: "stand-small-mia.webp",
};

await mkdir(targetDir, { recursive: true });
const files = await readdir(sourceDir);

for (const [key, target] of Object.entries(images)) {
  const chunks = files.filter((name) => name.startsWith(`${key}.`) && name.endsWith(".b64")).sort();
  if (!chunks.length) throw new Error(`Missing product image chunks for ${key}`);
  const encodedParts = await Promise.all(chunks.map((name) => readFile(join(sourceDir, name), "utf8")));
  const bytes = Buffer.from(encodedParts.join("").replace(/\s+/g, ""), "base64");
  if (bytes.length < 50000) throw new Error(`Decoded product image ${key} is unexpectedly small (${bytes.length} bytes)`);
  await writeFile(join(targetDir, target), bytes);
  console.log(`Restored ${target} (${bytes.length} bytes)`);
}
