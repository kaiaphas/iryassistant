import assert from "node:assert/strict";
import test from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { copyProductDraft, ProductManager } from "../components/products/ProductManager";
import { UnsavedChangesProvider } from "../lib/unsaved-changes";

test("상품관리 화면의 두 탭과 로딩 상태가 렌더링된다", () => {
  const html = renderToStaticMarkup(<UnsavedChangesProvider><ProductManager /></UnsavedChangesProvider>);
  assert.match(html, /상품별 계산/);
  assert.match(html, /상품 상세/);
  assert.match(html, /상품을 불러오는 중/);
});

test("상품 복사는 식별자를 비우고 현재 입력된 비용과 조건을 보존한다", () => {
  const source = {
    id: "original-id", code: "WD01", name: "완주", incentiveCondition: "20명 이상",
    headcount: "20", price: "98000", vehicleCost: "900000", guideCost: "8500",
    snackCost: "12000", admissionCost: "0", mealCost: "", taxRate: "10", incentive: "450000",
  };
  const copy = copyProductDraft(source);
  assert.equal(copy.id, undefined);
  assert.equal(copy.code, "");
  assert.equal(copy.name, "");
  assert.equal(copy.admissionCost, "0");
  assert.equal(copy.mealCost, "");
  assert.equal(copy.headcount, "20");
  assert.equal(copy.incentiveCondition, "20명 이상");
  copy.price = "100000";
  assert.equal(source.price, "98000");
});
