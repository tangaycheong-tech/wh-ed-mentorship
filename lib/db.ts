// ============================================================
// lib/db.ts — Direct pg Pool client for Supabase PostgreSQL
// Using pg directly to avoid Next.js webpack mangling issues
// ============================================================

import { Pool } from "pg";
import { lookup } from "dns/promises";
import { URL } from "url";

// Lazy singleton — only initialized on first use, not at module load
let _pool: Pool | null = null;

async function getPool(): Promise<Pool> {
  if (_pool) return _pool;

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const url = new URL(DATABASE_URL);
  const rawHostname = url.hostname;

  // Handle IPv6 addresses (hostnames like [::1] or [2406:...])
  if (rawHostname.startsWith("[")) {
    // IPv6 address in brackets — pg supports this natively, no DNS lookup needed
    _pool = new Pool({
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    return _pool;
  }

  // Force IPv4 lookup to avoid IPv6 issues on Render/Cloudflare
  const ipv4 = await lookup(rawHostname, { family: 4 }).catch(() => null);
  if (ipv4 && ipv4.address) {
    url.hostname = ipv4.address;
  }

  _pool = new Pool({
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

  return _pool;
}

// Query helper — mimics neon tagged template behavior
// Accepts either: sql`SELECT * FROM users` (with embedded values)
// Or: query("SELECT * FROM users WHERE id = $1", [id]) for dynamic strings
export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray | string,
  ...values: unknown[]
): Promise<T[]> {
  const pool = await getPool();

  let text: string;
  let params: unknown[];

  if (typeof strings === "string") {
    // Called as regular function: query("SELECT * FROM users WHERE id = $1", [id])
    text = strings;
    params = Array.isArray(values[0]) ? values[0] : values;
  } else {
    // Called as tagged template: sql`SELECT * FROM users WHERE id = ${id}`
    text = strings.reduce((acc, str, i) => {
      const paramIndex = i + 1;
      const param = values[i] !== undefined ? `$${paramIndex}` : "";
      return acc + str + param;
    }, "");
    params = values;
  }

  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Backward-compatible sql alias (used as tagged template)
export const sql = query;

// Export pool for direct use (e.g., transactions)
export { getPool as pool };

export default query;