import { NextRequest, NextResponse } from "next/server";
import { evaluateFormulaInput, type FormulaContext } from "@/lib/integrated-settlement-calculator";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { formula?: string; context?: FormulaContext };
    const result = evaluateFormulaInput(body.formula, body.context ?? {
      peopleCount: 0,
      unitPrice: 0,
      totalIncome: 0,
      operationCost: 0,
      vehicleCost: 0,
      guideCost: 0,
      kimbapCost: 0,
      fruitCost: 0,
      riceCakeWaterCost: 0,
      snackBoxCost: 0,
      balance: 0,
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "수식을 계산할 수 없습니다.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
