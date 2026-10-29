export const productNumberFields = ["headcount", "price", "vehicleCost", "guideCost", "snackCost", "admissionCost", "mealCost", "taxRate", "incentive"] as const;
export type ProductNumberField = (typeof productNumberFields)[number];
export type ProductEstimate = {
  id?: string;
  code: string;
  name: string;
  incentiveCondition: string;
} & Record<ProductNumberField, number | null>;

export const emptyProduct: ProductEstimate = {
  code: "", name: "", incentiveCondition: "", headcount: null, price: null,
  vehicleCost: null, guideCost: null, snackCost: null, admissionCost: null,
  mealCost: null, taxRate: 0.1, incentive: null,
};

export function calculateProduct(product: ProductEstimate) {
  const { headcount, price, vehicleCost, guideCost, snackCost, admissionCost, mealCost, taxRate, incentive } = product;
  if (headcount === null || headcount <= 0 || !Number.isInteger(headcount) || headcount > 100000) return null;
  const valid = (value: number | null): value is number => value !== null && Number.isFinite(value) && value >= 0 && value <= 1000000000;
  const cost = valid(vehicleCost) && valid(guideCost) && valid(snackCost) && valid(admissionCost) && valid(mealCost)
    ? vehicleCost + (guideCost + snackCost + admissionCost + mealCost) * headcount : null;
  const tax = cost !== null && valid(taxRate) && taxRate <= 1 ? cost * taxRate : null;
  const expense = cost !== null && tax !== null ? cost + tax : null;
  const revenue = valid(price) ? price * headcount : null;
  const profit = revenue !== null && valid(incentive) && expense !== null ? revenue + incentive - expense : null;
  return { cost, tax, expense, revenue, profit, perPerson: profit === null ? null : profit / headcount };
}

export function parseProduct(value: unknown): ProductEstimate {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("상품 정보를 확인해주세요.");
  const data = value as Record<string, unknown>;
  if (typeof data.code !== "string" || !data.code.trim() || data.code.trim().length > 100) throw new Error("상품 코드를 입력해주세요. (100자 이내)");
  if (typeof data.name !== "string" || !data.name.trim() || data.name.trim().length > 300) throw new Error("상품명을 입력해주세요. (300자 이내)");
  if (typeof data.incentiveCondition !== "string" || data.incentiveCondition.length > 2000) throw new Error("인센티브 조건을 확인해주세요. (2000자 이내)");
  const product: ProductEstimate = { ...emptyProduct, code: data.code.trim(), name: data.name.trim(), incentiveCondition: data.incentiveCondition.trim() };
  for (const field of productNumberFields) {
    const input = data[field];
    if (input === null) { product[field] = null; continue; }
    if (typeof input !== "number" || !Number.isFinite(input) || input < 0 || input > 1000000000) throw new Error("금액과 인원은 0 이상의 숫자로 입력해주세요.");
    if (field === "headcount" && (!Number.isInteger(input) || input < 1 || input > 100000)) throw new Error("기준 인원은 1 이상 100,000 이하의 정수여야 합니다.");
    if (field === "taxRate" && input > 1) throw new Error("부가세율은 0%에서 100% 사이여야 합니다.");
    product[field] = input;
  }
  if (data.id !== undefined) {
    if (typeof data.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.id)) throw new Error("상품 식별자가 올바르지 않습니다.");
    product.id = data.id;
  }
  return product;
}
