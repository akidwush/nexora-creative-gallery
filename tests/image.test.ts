import assert from "node:assert/strict";
import test from "node:test";
import { fitImageWithinDimension } from "../src/lib/image";

test("gambar besar diperkecil tanpa mengubah rasio panorama", () => {
  const result = fitImageWithinDimension(10_000, 400, 2_560);

  assert.deepEqual(result, { width: 2_560, height: 102 });
  assert.ok(Math.abs(result.width / result.height - 25) < 0.2);
});

test("gambar portrait dan gambar kecil mempertahankan proporsi", () => {
  assert.deepEqual(fitImageWithinDimension(400, 10_000, 2_560), {
    width: 102,
    height: 2_560,
  });
  assert.deepEqual(fitImageWithinDimension(1_200, 800, 2_560), {
    width: 1_200,
    height: 800,
  });
});

test("dimensi tidak valid ditolak", () => {
  assert.throws(() => fitImageWithinDimension(0, 800), /tidak valid/i);
  assert.throws(() => fitImageWithinDimension(800, Number.NaN), /tidak valid/i);
});
