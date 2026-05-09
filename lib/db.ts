// ============================================================
// lib/db.ts — Direct pg Pool client for Supabase PostgreSQL
// Using pg directly to avoid Next.js webpack mangling issues
// ============================================================

import { Pool } from "pg";
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

  // Check if this is an IPv6 address
  // IPv6 addresses contain colons but are NOT hostnames like .co, .com, etc.
  // We detect IPv6 by checking if it starts with [ (bracketed) OR if it matches IPv6 pattern
  // A real IPv6 will have 2+ colons and not contain common TLD suffixes like .co, .com
  const isIPv6 = (rawHostname.startsWith("[") && rawHostname.endsWith("]")) ||
                 (/^[0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){2,7}$/.test(rawHostname) && rawHostname.includes(":"));

  let poolConfig: ConstructorParameters<typeof Pool>[0];

  if (isIPv6) {
    // IPv6: use host/port params (connectionString with brackets fails DNS lookup)
    const ipv6 = rawHostname.replace(/^\[|\]$/g, ""); // strip brackets
    poolConfig = {
      host: ipv6,
      port: parseInt(url.port || "5432", 10),
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };
  } else {
    // IPv4 / hostname: use connectionString
    poolConfig = {
      connectionString: DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    };
  }

  _pool = new Pool(poolConfig);
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