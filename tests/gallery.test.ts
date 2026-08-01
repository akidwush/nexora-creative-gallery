import assert from "node:assert/strict";
import test from "node:test";
import {
  createSafeFileName,
  getWhatsAppUrl,
  isGalleryWorkId,
  isValidWhatsAppNumber,
  normalizeOptionalUrl,
  normalizeWhatsAppNumber,
  slugify,
} from "../src/lib/gallery";

test("slugify membuat slug stabil dan aman", () => {
  assert.equal(slugify("  Karya Édisi #1  "), "karya-edisi-1");
});

test("tautan kreator dinormalisasi dan protokol berbahaya ditolak", () => {
  assert.equal(
    normalizeOptionalUrl("instagram.com/nexora"),
    "https://instagram.com/nexora",
  );
  assert.equal(normalizeOptionalUrl("  "), null);
  assert.throws(
    () => normalizeOptionalUrl("javascript:alert(1)"),
    /tidak valid/i,
  );
  assert.throws(
    () => normalizeOptionalUrl("mailto:admin@nexora.id"),
    /tidak valid/i,
  );
});

test("nomor WhatsApp Indonesia dinormalisasi dan divalidasi", () => {
  assert.equal(normalizeWhatsAppNumber("0812-3456-7890"), "6281234567890");
  assert.equal(normalizeWhatsAppNumber("812 3456 7890"), "6281234567890");
  assert.equal(normalizeWhatsAppNumber("+62 812 3456 7890"), "6281234567890");
  assert.equal(isValidWhatsAppNumber("6281234567890"), true);
  assert.equal(isValidWhatsAppNumber("123"), false);
  assert.equal(getWhatsAppUrl("123", "Karya"), null);
});

test("nama file mengikuti MIME type dan membuang karakter berbahaya", () => {
  assert.equal(
    createSafeFileName("../Poster Final!!.exe", "image/webp"),
    "Poster-Final.webp",
  );
  assert.equal(createSafeFileName("✨.png", "image/png"), "karya.png");
  assert.equal(createSafeFileName("payload.html"), "payload.jpg");
});

test("ID karya hanya menerima UUID yang valid", () => {
  assert.equal(
    isGalleryWorkId("da50f9f9-00e7-4c17-96b2-e86a701d6ff6"),
    true,
  );
  assert.equal(isGalleryWorkId("bukan-id-karya"), false);
});
