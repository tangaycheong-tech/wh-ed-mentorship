// lib/query.ts — Query helper that returns typed arrays for Neon
import sql from "@/lib/db";

// Helper to run a query and cast result as an array of objects
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<T[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await sql(strings, ...params) as T[];
}

// Helper for single-row queries
export async function queryOne<T = Record<string, unknown>>(
  strings: TemplateStringsArray,
  ...params: unknown[]
): Promise<T | null> {
  const rows = await query<T>(strings, ...params);
  return rows.length > 0 ? rows[0] : null;
}