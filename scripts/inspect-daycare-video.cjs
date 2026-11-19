// Lightweight source-MP4 audit on any CI runner (no ffmpeg binary required).
// Inspection only: neither decodes nor transcodes video. Never claim this proves iOS playback.
const fs = require("node:fs");
const bytes = fs.readFileSync("src/assets/skolkari.mp4");

const boxes = [];
let pos = 0;
while (pos + 8 <= bytes.length) {
  let size = bytes.readUInt32BE(pos);
  const type = bytes.toString("ascii", pos + 4, pos + 8);
  let header = 8;
  if (size === 1) {
    if (pos + 16 > bytes.length) break;
    size = Number(bytes.readBigUInt64BE(pos + 8));
    header = 16;
  } else if (size === 0) {
    size = bytes.length - pos;
  }
  if (size < header || pos + size > bytes.length) break;
  boxes.push({ type, offset: pos, size });
  pos += size;
}
const ftyp = boxes.find((b) => b.type === "ftyp");
const moov = boxes.find((b) => b.type === "moov");
const mdat = boxes.find((b) => b.type === "mdat");
const codecs = ["avc1", "avc3", "hvc1", "hev1", "mp4v", "av01", "vp09", "mp4a", "alac", "ac-3"].filter((s) => bytes.includes(Buffer.from(s, "ascii")));
const brands = ftyp ? bytes.toString("ascii", ftyp.offset + 8, Math.min(ftyp.offset + ftyp.size, ftyp.offset + 32)) : "";
const result = {
  bytes: bytes.length,
  topLevelBoxes: boxes.map((b) => ({ type: b.type, offset: b.offset, size: b.size })),
  brands,
  codecMarkers: codecs,
  fastStart: Boolean(moov && mdat && moov.offset < mdat.offset),
};
console.log("DAYCARE VIDEO SOURCE INSPECTION:", JSON.stringify(result, null, 2));
if (!ftyp || !moov || !mdat) throw new Error("Original MP4 lacks ftyp/moov/mdat structure");
