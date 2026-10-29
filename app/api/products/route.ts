import { NextRequest, NextResponse } from "next/server";
import { isCurrentAdmin } from "@/lib/auth";
import { parseProduct, type ProductEstimate } from "@/lib/product-estimate";
import { readAllRows } from "@/lib/supabase-batch";
import { createSupabaseServerClient } from "@/repositories/supabase/reservation-repository";

type ProductRow = {
  id: string; code: string; name: string; incentive_condition: string;
  headcount: number | null; price: number | null; vehicle_cost: number | null;
  guide_cost: number | null; snack_cost: number | null; admission_cost: number | null;
  meal_cost: number | null; tax_rate: number | null; incentive: number | null;
};

function fromRow(row: ProductRow): ProductEstimate {
  const number = (value: number | null) => value === null ? null : Number(value);
  return { id: row.id, code: row.code, name: row.name, incentiveCondition: row.incentive_condition,
    headcount: number(row.headcount), price: number(row.price), vehicleCost: number(row.vehicle_cost),
    guideCost: number(row.guide_cost), snackCost: number(row.snack_cost), admissionCost: number(row.admission_cost),
    mealCost: number(row.meal_cost), taxRate: number(row.tax_rate), incentive: number(row.incentive) };
}

function toRow(product: ProductEstimate) {
  return { code: product.code, name: product.name, incentive_condition: product.incentiveCondition,
    headcount: product.headcount, price: product.price, vehicle_cost: product.vehicleCost,
    guide_cost: product.guideCost, snack_cost: product.snackCost, admission_cost: product.admissionCost,
    meal_cost: product.mealCost, tax_rate: product.taxRate, incentive: product.incentive,
    updated_at: new Date().toISOString() };
}

export async function GET() {
  if (!(await isCurrentAdmin())) return NextResponse.json({ message: "접근 권한이 없습니다." }, { status: 403 });
  try {
    const db = createSupabaseServerClient();
    const { data, error } = await readAllRows<ProductRow, { message?: string }>((from, to) =>
      db.from("product_estimates").select("id,code,name,incentive_condition,headcount,price,vehicle_cost,guide_cost,snack_cost,admission_cost,meal_cost,tax_rate,incentive").order("code").order("id").range(from, to));
    if (error) throw error;
    return NextResponse.json((data ?? []).map(fromRow));
  } catch {
    return NextResponse.json({ message: "상품 목록을 불러오지 못했습니다. 저장소 설정을 확인해주세요." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isCurrentAdmin())) return NextResponse.json({ message: "접근 권한이 없습니다." }, { status: 403 });
  let product: ProductEstimate;
  try { product = parseProduct(await request.json()); }
  catch (error) { return NextResponse.json({ message: error instanceof Error ? error.message : "입력값을 확인해주세요." }, { status: 400 }); }
  try {
    const db = createSupabaseServerClient();
    const query = product.id
      ? db.from("product_estimates").update(toRow(product)).eq("id", product.id)
      : db.from("product_estimates").insert(toRow(product));
    const { data, error } = await query.select("id,code,name,incentive_condition,headcount,price,vehicle_cost,guide_cost,snack_cost,admission_cost,meal_cost,tax_rate,incentive").maybeSingle();
    if (error?.code === "23505") return NextResponse.json({ message: "이미 사용 중인 상품 코드입니다." }, { status: 409 });
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "해당 상품을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json(fromRow(data as ProductRow));
  } catch {
    return NextResponse.json({ message: "상품을 저장하지 못했습니다. 다시 시도해주세요." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isCurrentAdmin())) return NextResponse.json({ message: "접근 권한이 없습니다." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id") ?? "";
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return NextResponse.json({ message: "상품 식별자가 올바르지 않습니다." }, { status: 400 });
  try {
    const { data, error } = await createSupabaseServerClient().from("product_estimates").delete().eq("id", id).select("id").maybeSingle();
    if (error) throw error;
    if (!data) return NextResponse.json({ message: "해당 상품을 찾을 수 없습니다." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ message: "상품을 삭제하지 못했습니다." }, { status: 500 });
  }
}
