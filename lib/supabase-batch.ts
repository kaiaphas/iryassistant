export const SUPABASE_PAGE_SIZE = 500;

type QueryError = { message?: string; code?: string };
type QueryResult<T, E> = { data: T[] | null; error: E | null };

export function chunkForFilter(values: string[]) {
  const chunks: string[][] = [];
  let current: string[] = [];
  let encodedLength = 0;
  for (const value of values) {
    const length = encodeURIComponent(JSON.stringify(value)).length + 3;
    if (length > 6000) throw new Error("Supabase filter value exceeds the request size limit");
    if (current.length >= 100 || encodedLength + length > 6000) {
      chunks.push(current);
      current = [];
      encodedLength = 0;
    }
    current.push(value);
    encodedLength += length;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export function chunkForPayload<T>(values: T[], maxRows = 100) {
  if (!Number.isSafeInteger(maxRows) || maxRows < 1) throw new Error("Invalid payload batch size");
  const chunks: T[][] = [];
  let current: T[] = [];
  let bytes = 2;
  const encoder = new TextEncoder();
  for (const value of values) {
    const size = encoder.encode(JSON.stringify(value)).length + 1;
    if (size > 1024 * 1024 - 2) throw new Error("A source record exceeds the 1 MiB payload limit");
    if (current.length >= maxRows || bytes + size > 1024 * 1024) {
      chunks.push(current);
      current = [];
      bytes = 2;
    }
    current.push(value);
    bytes += size;
  }
  if (current.length) chunks.push(current);
  return chunks;
}

export async function readAllRows<T, E extends QueryError>(
  fetchPage: (from: number, to: number) => PromiseLike<QueryResult<T, E>>,
): Promise<QueryResult<T, E>> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    let result = await fetchPage(from, from + SUPABASE_PAGE_SIZE - 1);
    for (let attempt = 0; attempt < 2 && result.error; attempt++) {
      if (!/fetch failed|timeout|timed out|network|connection|503|502|504|429/i.test(result.error.message ?? "")) break;
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
      result = await fetchPage(from, from + SUPABASE_PAGE_SIZE - 1);
    }
    if (result.error) return { data: null, error: result.error };
    const page = result.data ?? [];
    if (page.length === 0) return { data: rows, error: null };
    rows.push(...page);
    // Advance by the returned count even when the server's row cap is lower.
    from += page.length;
  }
}
