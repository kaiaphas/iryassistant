import assert from "node:assert/strict";
import test from "node:test";
import { calculateProduct, emptyProduct, parseProduct } from "../lib/product-estimate";

const product = { ...emptyProduct, code: "26_WD20", name: "완주", headcount: 20, price: 98000,
  vehicleCost: 900000, guideCost: 8500, snackCost: 12000, admissionCost: 0, mealCost: 15000,
  taxRate: 0.1, incentive: 450000 };

test("원본 상품의 예상 이익과 인원 변경을 계산한다", () => {
  assert.equal(calculateProduct(product)?.cost, 1610000);
  assert.equal(calculateProduct(product)?.profit, 639000);
  assert.equal(calculateProduct(product)?.perPerson, 31950);
  assert.equal(calculateProduct({ ...product, headcount: 25 })?.profit, 933750);
  assert.equal(calculateProduct({ ...product, price: 100000 })?.revenue, 2000000);
});

test("미입력과 0원을 구분하고 독립적인 중간값은 표시한다", () => {
  assert.equal(calculateProduct({ ...product, admissionCost: null })?.profit, null);
  assert.equal(calculateProduct({ ...product, incentive: null })?.cost, 1610000);
  assert.equal(calculateProduct({ ...product, incentive: null })?.profit, null);
  assert.equal(calculateProduct({ ...product, incentive: 0 })?.profit, 189000);
  assert.equal(calculateProduct({ ...product, headcount: 0 }), null);
});

test("API 입력값의 타입과 범위를 검증한다", () => {
  assert.equal(parseProduct({ ...product, code: "  WD  " }).code, "WD");
  assert.throws(() => parseProduct({ ...product, name: "  " }));
  assert.throws(() => parseProduct({ ...product, headcount: 1.5 }));
  assert.throws(() => parseProduct({ ...product, price: -1 }));
  assert.throws(() => parseProduct({ ...product, taxRate: 1.1 }));
  assert.throws(() => parseProduct({ ...product, incentive: "0" }));
  assert.equal(parseProduct({ ...product, incentive: null }).incentive, null);
});
