import assert from "node:assert/strict";
import { test } from "node:test";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { formatReservationPrintTime, recordReservationPrint } from "../lib/reservation-print";
import { ReservationPrintConfirmDialog } from "../components/reservations/ReservationPrintConfirmDialog";

test("print time is displayed in Korea time including seconds and date rollover", () => {
  assert.equal(formatReservationPrintTime("2026-10-13T14:30:45.123Z"), "2026-10-13 23:30:45");
  assert.equal(formatReservationPrintTime("2026-10-13T15:00:00Z"), "2026-10-14 00:00:00");
  assert.equal(formatReservationPrintTime("2026-10-14T00:00:00+09:00"), "2026-10-14 00:00:00");
  assert.equal(formatReservationPrintTime(), "인쇄 기록 없음");
  assert.equal(formatReservationPrintTime("invalid"), "인쇄 시간 확인 불가");
});

test("print recording only sends the schedule ID and uses the server timestamp", async (context) => {
  let calls = 0;
  context.mock.method(globalThis, "fetch", async (url: string | URL | Request, options?: RequestInit) => {
    calls++;
    assert.equal(url, "/api/reservations/test-id/print");
    assert.equal(options?.method, "POST");
    assert.equal(options?.body, undefined);
    assert.ok(options?.signal instanceof AbortSignal);
    return Response.json({ printedAt: "2026-10-13T14:30:45Z" });
  });
  assert.equal(await recordReservationPrint("test-id"), "2026-10-13T14:30:45Z");
  assert.equal(calls, 1);
});

test("failed requests do not return an unrecorded print time", async (context) => {
  context.mock.method(globalThis, "fetch", async () => Response.json({ message: "failed" }, { status: 500 }));
  await assert.rejects(recordReservationPrint("test-id"), /저장하지 못했습니다/);
});

test("missing or invalid server timestamps are rejected", async (context) => {
  const mocked = context.mock.method(globalThis, "fetch", async () => Response.json({ ok: true }));
  await assert.rejects(recordReservationPrint("test-id"), /응답이 올바르지/);
  mocked.mock.mockImplementation(async () => Response.json({ printedAt: "invalid" }));
  await assert.rejects(recordReservationPrint("test-id"), /응답이 올바르지/);
});

test("login redirects and network failures never proceed as a successful record", async (context) => {
  const response = Response.json({ printedAt: "2026-10-13T14:30:45Z" });
  Object.defineProperty(response, "redirected", { value: true });
  const mocked = context.mock.method(globalThis, "fetch", async () => response);
  await assert.rejects(recordReservationPrint("test-id"));
  mocked.mock.mockImplementation(async () => { throw new Error("network failure"); });
  await assert.rejects(recordReservationPrint("test-id"), /network failure/);
});

test("confirmation has explicit Yes and No labels and an accessible description", () => {
  const html = renderToStaticMarkup(React.createElement(ReservationPrintConfirmDialog, {
    open: false, saving: false, error: "", onCancel() {}, onConfirm() {},
  }));
  assert.match(html, /<dialog[^>]*aria-labelledby=/);
  assert.match(html, /aria-describedby=/);
  assert.match(html, /명단을 인쇄하시겠습니까\?/);
  assert.match(html, /시간이 기록됩니다\./);
  assert.match(html, />No<\/button>/);
  assert.match(html, />Yes<\/button>/);
});

test("confirmation disables both actions while recording and exposes failures", () => {
  const html = renderToStaticMarkup(React.createElement(ReservationPrintConfirmDialog, {
    open: false, saving: true, error: "저장 실패", onCancel() {}, onConfirm() {},
  }));
  assert.equal((html.match(/disabled=""/g) ?? []).length, 2);
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /기록 중…/);
});
