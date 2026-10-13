import assert from "node:assert/strict";
import { test } from "node:test";
import { chunkForFilter, chunkForPayload, readAllRows } from "../lib/supabase-batch";

test("filter requests stay bounded as data and key lengths grow", () => {
  const values = Array.from({ length: 10001 }, (_, i) => `${i}|${"긴키".repeat(30)}`);
  const chunks = chunkForFilter(values);
  assert.deepEqual(chunks.flat(), values);
  assert.ok(chunks.every((part) => part.length <= 100));
  assert.ok(chunks.every((part) => part.reduce((size, value) => size + encodeURIComponent(JSON.stringify(value)).length + 3, 0) <= 6000));
  assert.deepEqual(chunkForFilter([]), []);
  assert.throws(() => chunkForFilter(["x".repeat(6001)]));
});

test("reads beyond 1000 rows even with a smaller server cap", async () => {
  const rows = Array.from({ length: 3501 }, (_, id) => ({ id }));
  const result = await readAllRows(async (from, to) => ({
    data: rows.slice(from, Math.min(to + 1, from + 137)), error: null,
  }));
  assert.deepEqual(result.data, rows);
  assert.equal(result.error, null);
});

test("POST batches honor byte limits and reject oversized records before writes", () => {
  const rows = Array.from({ length: 1050 }, (_, id) => ({ id, memo: "가".repeat(10000) }));
  const batches = chunkForPayload(rows);
  assert.deepEqual(batches.flat(), rows);
  assert.ok(batches.every((batch) => new TextEncoder().encode(JSON.stringify(batch)).length <= 1024 * 1024));
  assert.throws(() => chunkForPayload([{ memo: "x".repeat(1024 * 1024) }]));
  assert.throws(() => chunkForPayload(rows, 0));
});

test("later page errors never return a silently truncated list", async () => {
  const error = { message: "permission denied", code: "42501" };
  const result = await readAllRows(async (from) => from === 0
    ? { data: [{ id: 1 }], error: null }
    : { data: null, error });
  assert.equal(result.data, null);
  assert.equal(result.error, error);
});

test("temporary read failures retry, permanent failures stop", async () => {
  let calls = 0;
  const result = await readAllRows(async () => {
    calls++;
    return calls < 3 ? { data: null, error: { message: "TypeError: fetch failed" } }
      : { data: [], error: null };
  });
  assert.equal(calls, 3);
  assert.deepEqual(result.data, []);
  calls = 0;
  await readAllRows(async () => { calls++; return { data: null, error: { message: "missing column" } }; });
  assert.equal(calls, 1);
});
