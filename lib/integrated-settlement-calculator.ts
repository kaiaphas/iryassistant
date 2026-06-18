import type { IntegratedSettlementRow } from "@/lib/types";

export type FormulaContext = {
  peopleCount: number;
  unitPrice: number;
  totalIncome: number;
  operationCost: number;
  vehicleCost: number;
  guideCost: number;
  kimbapCost: number;
  fruitCost: number;
  riceCakeWaterCost: number;
  snackBoxCost: number;
  balance: number;
};

type Token =
  | { type: "number"; value: number }
  | { type: "ref"; value: keyof FormulaContext }
  | { type: "sum" }
  | { type: "operator"; value: "+" | "-" | "*" | "/" }
  | { type: "paren"; value: "(" | ")" }
  | { type: "comma" };

const columnMap: Record<string, keyof FormulaContext> = {
  D: "peopleCount",
  E: "unitPrice",
  F: "totalIncome",
  G: "operationCost",
  H: "vehicleCost",
  J: "guideCost",
  L: "kimbapCost",
  M: "fruitCost",
  N: "riceCakeWaterCost",
  O: "snackBoxCost",
  P: "balance",
};

function numberValue(value: unknown) {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? Math.round(value) : 0;
  return Math.round(Number(String(value).replaceAll(",", ""))) || 0;
}

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;

  while (index < expression.length) {
    const char = expression[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }

    if (/[0-9.]/.test(char)) {
      let end = index + 1;
      while (end < expression.length && /[0-9.]/.test(expression[end])) end += 1;
      const raw = expression.slice(index, end);
      const value = Number(raw);
      if (!Number.isFinite(value)) throw new Error(`숫자 형식이 올바르지 않습니다: ${raw}`);
      tokens.push({ type: "number", value });
      index = end;
      continue;
    }

    if (/[A-Za-z]/.test(char)) {
      let end = index + 1;
      while (end < expression.length && /[A-Za-z0-9]/.test(expression[end])) end += 1;
      const raw = expression.slice(index, end).toUpperCase();
      if (raw === "SUM") {
        tokens.push({ type: "sum" });
      } else {
        const match = raw.match(/^([A-Z]+)[0-9]+$/);
        const key = match ? columnMap[match[1]] : undefined;
        if (!key) throw new Error(`지원하지 않는 참조입니다: ${raw}`);
        tokens.push({ type: "ref", value: key });
      }
      index = end;
      continue;
    }

    if (char === "+" || char === "-" || char === "*" || char === "/") {
      tokens.push({ type: "operator", value: char });
      index += 1;
      continue;
    }

    if (char === "(" || char === ")") {
      tokens.push({ type: "paren", value: char });
      index += 1;
      continue;
    }

    if (char === ",") {
      tokens.push({ type: "comma" });
      index += 1;
      continue;
    }

    throw new Error(`지원하지 않는 문자입니다: ${char}`);
  }

  return tokens;
}

function parseTokens(tokens: Token[], context: FormulaContext) {
  let index = 0;

  function peek() {
    return tokens[index];
  }

  function consume() {
    const token = tokens[index];
    index += 1;
    return token;
  }

  function parseExpression(): number {
    let value = parseTerm();
    while (peek()?.type === "operator" && (peek() as Extract<Token, { type: "operator" }>).value.match(/[+-]/)) {
      const operator = (consume() as Extract<Token, { type: "operator" }>).value;
      const right = parseTerm();
      value = operator === "+" ? value + right : value - right;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek()?.type === "operator" && (peek() as Extract<Token, { type: "operator" }>).value.match(/[*/]/)) {
      const operator = (consume() as Extract<Token, { type: "operator" }>).value;
      const right = parseFactor();
      if (operator === "/" && right === 0) throw new Error("0으로 나눌 수 없습니다.");
      value = operator === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseFactor(): number {
    const token = peek();
    if (token?.type === "operator" && (token.value === "+" || token.value === "-")) {
      consume();
      const value = parseFactor();
      return token.value === "-" ? -value : value;
    }
    return parsePrimary();
  }

  function parsePrimary(): number {
    const token = consume();
    if (!token) throw new Error("수식이 완성되지 않았습니다.");
    if (token.type === "number") return token.value;
    if (token.type === "ref") return context[token.value] ?? 0;

    if (token.type === "paren" && token.value === "(") {
      const value = parseExpression();
      const close = consume();
      if (close?.type !== "paren" || close.value !== ")") throw new Error("괄호가 닫히지 않았습니다.");
      return value;
    }

    if (token.type === "sum") {
      const open = consume();
      if (open?.type !== "paren" || open.value !== "(") throw new Error("SUM 함수에는 괄호가 필요합니다.");
      let sum = 0;
      if (peek()?.type === "paren" && (peek() as Extract<Token, { type: "paren" }>).value === ")") {
        consume();
        return 0;
      }
      while (index < tokens.length) {
        sum += parseExpression();
        const next = consume();
        if (next?.type === "paren" && next.value === ")") return sum;
        if (next?.type !== "comma") throw new Error("SUM 함수 인자는 쉼표로 구분해주세요.");
      }
      throw new Error("SUM 함수가 닫히지 않았습니다.");
    }

    throw new Error("수식 형식이 올바르지 않습니다.");
  }

  const value = parseExpression();
  if (index < tokens.length) throw new Error("수식 뒤에 해석할 수 없는 값이 있습니다.");
  return value;
}

export function evaluateFormulaInput(input: string | undefined, context: FormulaContext) {
  const value = input?.trim() ?? "";
  if (!value) return { value: 0, formula: undefined };
  if (!value.startsWith("=")) return { value: numberValue(value), formula: undefined };

  const expression = value.slice(1).trim();
  if (!expression) throw new Error("수식을 입력해주세요.");
  return { value: Math.round(parseTokens(tokenize(expression), context)), formula: value };
}

export function getPeopleCount(row: Pick<IntegratedSettlementRow, "overridePeopleCount" | "sourcePeopleCount">) {
  return row.overridePeopleCount ?? row.sourcePeopleCount ?? 0;
}

export function getProductName(row: Pick<IntegratedSettlementRow, "overrideProductName" | "sourceProductName">) {
  return row.overrideProductName?.trim() || row.sourceProductName || "상품명 미정";
}

export function getFormulaContext(row: IntegratedSettlementRow): FormulaContext {
  return {
    peopleCount: getPeopleCount(row),
    unitPrice: numberValue(row.unitPrice),
    totalIncome: numberValue(row.totalIncome),
    operationCost: numberValue(row.operationCost),
    vehicleCost: numberValue(row.vehicleCost),
    guideCost: numberValue(row.guideCost),
    kimbapCost: numberValue(row.kimbapCost),
    fruitCost: numberValue(row.fruitCost),
    riceCakeWaterCost: numberValue(row.riceCakeWaterCost),
    snackBoxCost: numberValue(row.snackBoxCost),
    balance: numberValue(row.balance),
  };
}

function computeAmount(current: number, formula: string | undefined, context: FormulaContext) {
  if (!formula?.trim()) return numberValue(current);
  return evaluateFormulaInput(formula, context).value;
}

export function calculateIntegratedSettlementRow(row: IntegratedSettlementRow): IntegratedSettlementRow {
  const next = { ...row };
  next.unitPrice = numberValue(next.unitPrice);
  next.operationCost = numberValue(next.operationCost);
  next.vehicleCost = numberValue(next.vehicleCost);
  next.guideCost = numberValue(next.guideCost);
  next.kimbapQty = numberValue(next.kimbapQty);
  next.kimbapUnitPrice = numberValue(next.kimbapUnitPrice);
  next.fruitQty = numberValue(next.fruitQty);
  next.fruitUnitPrice = numberValue(next.fruitUnitPrice);
  next.riceCakeWaterQty = numberValue(next.riceCakeWaterQty);
  next.riceCakeWaterUnitPrice = numberValue(next.riceCakeWaterUnitPrice);
  next.riceCakeWaterExtraCost = numberValue(next.riceCakeWaterExtraCost);
  next.snackBoxQty = numberValue(next.snackBoxQty);
  next.snackBoxUnitPrice = numberValue(next.snackBoxUnitPrice);
  next.adjustmentAmount = numberValue(next.adjustmentAmount);

  let context = getFormulaContext(next);
  next.totalIncome = computeAmount(next.totalIncome, next.totalIncomeFormula, context);

  context = getFormulaContext(next);
  next.operationCost = computeAmount(next.operationCost, next.operationCostFormula, context);
  next.vehicleCost = computeAmount(next.vehicleCost, next.vehicleCostFormula, context);
  next.guideCost = computeAmount(next.guideCost, next.guideCostFormula, context);

  next.kimbapCost = next.kimbapQty * next.kimbapUnitPrice;
  next.fruitCost = next.fruitQty * next.fruitUnitPrice;
  next.riceCakeWaterCost = next.riceCakeWaterQty * next.riceCakeWaterUnitPrice + next.riceCakeWaterExtraCost;
  next.snackBoxCost = next.snackBoxQty * next.snackBoxUnitPrice;

  const defaultBalance = next.totalIncome
    - next.operationCost
    - next.vehicleCost
    - next.guideCost
    - next.kimbapCost
    - next.fruitCost
    - next.riceCakeWaterCost
    - next.snackBoxCost;
  next.balance = defaultBalance;
  next.finalBalance = next.balance + next.adjustmentAmount;

  return next;
}
