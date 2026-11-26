import sharp from "sharp";

const signatures = {
  "image/jpeg": (bytes) => bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  "image/png": (bytes) => bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/webp": (bytes) => bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP",
  "image/avif": (bytes) => bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(bytes.toString("ascii", 8, 12)),
};

export function matchesImageContentType(bytes, contentType) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  return Boolean(signatures[contentType]?.(bytes));
}
export async function normalizeUploadedImage(bytes, contentType) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (!matchesImageContentType(bytes, contentType)) return null;
  try {
    const { data, info } = await sharp(bytes, { failOn: "error", limitInputPixels: 40_000_000 })
      .rotate()
      .webp({ quality: 85, effort: 4 })
      .toBuffer({ resolveWithObject: true });
    if (info.format !== "webp" || info.width < 1 || info.height < 1) return null;
    return data;
  } catch {
    return null;
  }
}
