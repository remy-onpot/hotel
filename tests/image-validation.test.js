import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { matchesImageContentType, normalizeUploadedImage } from "../app/_lib/imageValidation.js";

test("image MIME type must match the file signature", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
  assert.equal(matchesImageContentType(png, "image/png"), true);
  assert.equal(matchesImageContentType(png, "image/jpeg"), false);
  assert.equal(matchesImageContentType(jpeg, "image/jpeg"), true);
  assert.equal(matchesImageContentType(Buffer.from("not an image"), "image/webp"), false);
});

test("WebP and AVIF signatures are recognized", () => {
  const webp = Buffer.from("RIFF0000WEBP", "ascii");
  const avif = Buffer.from("0000ftypavif", "ascii");
  assert.equal(matchesImageContentType(webp, "image/webp"), true);
  assert.equal(matchesImageContentType(avif, "image/avif"), true);
});

test("valid uploads are decoded and normalized to WebP", async () => {
  const png = await readFile(new URL("../public/logo.png", import.meta.url));
  const normalized = await normalizeUploadedImage(png, "image/png");
  assert.ok(normalized);
  assert.equal(normalized.toString("ascii", 8, 12), "WEBP");
  assert.equal(await normalizeUploadedImage(Buffer.from("not a png"), "image/png"), null);
});
