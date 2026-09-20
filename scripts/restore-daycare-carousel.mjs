import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

const root = process.cwd();
const archivePath = path.join(root, "scripts", "daycare-carousel-assets.zip");
const outputDir = path.join(root, "src", "assets");
const expectedNames = Array.from(
  { length: 12 },
  (_, index) => `daycare-carousel-${String(index + 1).padStart(2, "0")}.avif`,
);

const archive = await readFile(archivePath);

function findEndOfCentralDirectory(buffer) {
  const signature = 0x06054b50;
  const minOffset = Math.max(0, buffer.length - 65_557);
  for (let offset = buffer.length - 22; offset >= minOffset; offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) return offset;
  }
  throw new Error("Daycare carousel ZIP: end-of-central-directory record not found");
}

function readStoredEntries(buffer) {
  const eocd = findEndOfCentralDirectory(buffer);
  const totalEntries = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map();

  for (let index = 0; index < totalEntries; index += 1) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) {
      throw new Error(`Daycare carousel ZIP: invalid central-directory entry ${index + 1}`);
    }

    const compressionMethod = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.subarray(offset + 46, offset + 46 + fileNameLength).toString("utf8");

    if (compressionMethod !== 0) {
      throw new Error(`Daycare carousel ZIP: ${name} is compressed; ZIP_STORED is required`);
    }
    if (compressedSize !== uncompressedSize) {
      throw new Error(`Daycare carousel ZIP: invalid stored size for ${name}`);
    }
    if (buffer.readUInt32LE(localHeaderOffset) !== 0x04034b50) {
      throw new Error(`Daycare carousel ZIP: invalid local header for ${name}`);
    }

    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart = localHeaderOffset + 30 + localNameLength + localExtraLength;
    const data = buffer.subarray(dataStart, dataStart + uncompressedSize);
    entries.set(name, data);

    offset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

const entries = readStoredEntries(archive);
const manifestBytes = entries.get("manifest.json");
if (!manifestBytes) throw new Error("Daycare carousel ZIP: manifest.json is missing");

const manifest = JSON.parse(manifestBytes.toString("utf8"));
const manifestByName = new Map(manifest.map((entry) => [entry.name, entry]));

await mkdir(outputDir, { recursive: true });

for (const name of expectedNames) {
  const image = entries.get(name);
  const metadata = manifestByName.get(name);
  if (!image || !metadata) throw new Error(`Daycare carousel ZIP: missing ${name}`);

  const header = image.subarray(0, 32).toString("ascii");
  if (!header.includes("ftypavif")) {
    throw new Error(`Daycare carousel ZIP: invalid AVIF header for ${name}`);
  }
  if (image.length !== metadata.bytes || image.length < 20_000) {
    throw new Error(`Daycare carousel ZIP: invalid size for ${name} (${image.length} bytes)`);
  }
  const sha256 = createHash("sha256").update(image).digest("hex");
  if (sha256 !== metadata.sha256) {
    throw new Error(`Daycare carousel ZIP: checksum mismatch for ${name}`);
  }

  await writeFile(path.join(outputDir, name), image);
  console.log(`Restored ${name}: ${image.length} bytes.`);
}

console.log(`Restored ${expectedNames.length} daycare carousel AVIF images.`);
