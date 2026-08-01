import assert from "node:assert/strict";
import test from "node:test";
import {
  getSocialPlatformMeta,
  getSocialUrlHostname,
  normalizeSocialLabel,
  normalizeSocialUrl,
} from "../src/lib/social-links";

test("URL sosial dinormalisasi dan hanya menerima HTTP(S)", () => {
  assert.equal(
    normalizeSocialUrl("instagram.com/nexora"),
    "https://instagram.com/nexora",
  );
  assert.equal(
    normalizeSocialUrl("https://www.youtube.com/@nexora"),
    "https://www.youtube.com/@nexora",
  );
  assert.throws(() => normalizeSocialUrl("javascript:alert(1)"), /http/i);
  assert.throws(() => normalizeSocialUrl("data:text/html,test"), /http/i);
  assert.throws(() => normalizeSocialUrl("  "), /wajib/i);
});

test("nama sosial dirapikan dan panjangnya divalidasi", () => {
  assert.equal(normalizeSocialLabel("  Instagram   Nexora  "), "Instagram Nexora");
  assert.throws(() => normalizeSocialLabel("X"), /2–50/);
});

test("metadata platform dan hostname memiliki fallback aman", () => {
  assert.equal(getSocialPlatformMeta("tiktok").mark, "TT");
  assert.equal(getSocialPlatformMeta("platform-baru").value, "other");
  assert.equal(
    getSocialUrlHostname("https://www.instagram.com/nexora"),
    "instagram.com",
  );
  assert.equal(getSocialUrlHostname("bukan-url"), "Buka tautan");
});
