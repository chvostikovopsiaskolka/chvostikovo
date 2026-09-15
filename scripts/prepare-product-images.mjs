import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const images = {
  "src/assets/products/stand-aloy-dog.webp": [
    ".image-fix/aloy-00.b64",
    ".image-fix/aloy-01.b64",
    ".image-fix/aloy-02.b64",
    ".image-fix/aloy-03.b64",
  ],
  "src/assets/products/stand-mia.webp": [
    ".image-fix/mia-00.b64",
    ".image-fix/mia-01.b64",
    ".image-fix/mia-02.b64",
    ".image-fix/mia-03.b64",
    ".image-fix/mia-04.b64",
  ],
  "src/assets/products/stand-woody-white.webp": [
    ".image-fix/woody-00.b64",
    ".image-fix/woody-01.b64",
    ".image-fix/woody-02.b64",
  ],
};

for (const [output, parts] of Object.entries(images)) {
  const chunks = await Promise.all(parts.map((part) => readFile(part, "utf8")));
  const buffer = Buffer.from(chunks.join(""), "base64");
  if (buffer.subarray(0, 4).toString("ascii") !== "RIFF" || buffer.subarray(8, 12).toString("ascii") !== "WEBP") {
    throw new Error(`Invalid WebP generated for ${output}`);
  }
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, buffer);
  console.log(`Prepared ${output} (${buffer.length} bytes)`);
}
