// lib/db.ts — Fixed with IPv6 bypass + sync pool accessor
import { Pool } from "pg";

// Lazy singleton — sync access to the resolved pool
let _pool: Pool | null = null;

function createPool(databaseUrl: string): Pool {
  const url = new URL(databaseUrl);
  const hostname = url.hostname;
  const isBracketedIPv6 = hostname.startsWith("[") && hostname.includes("]:");
  const isBareIPv6 = /^[0-9a-fA-F:]+$/.test(hostname) && hostname.includes(":");

  if (isBracketedIPv6 || isBareIPv6) {
    const ipv6 = hostname.replace(/^\[|\]:\d+$/g, "");
    const port = parseInt(url.port || "5432", 10);
    return new Pool({
      host: ipv6, port,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
      max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000,
    });
  }

  return new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10, idleTimeoutMillis: 30000, connectionTimeoutMillis: 15000,
  });
}

async function getPool(): Promise<Pool> {
  if (_pool) return _pool;
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
  _pool = createPool(DATABASE_URL);
  return _pool;
}

export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray | string,
  ...values: unknown[]
): Promise<T[]> {
  const p = await getPool();
  let text: string; let params: unknown[];
  if (typeof strings === "string") {
    text = strings;
    params = Array.isArray(values[0]) ? values[0] : values;
  } else {
    text = strings.reduce((acc, str, i) => acc + str + (values[i] !== undefined ? `$${i + 1}` : ""), "");
    params = values;
  }
  const result = await p.query(text, params);
  return result.rows as T[];
}

// Sync pool accessor — existing ed_mentor routes call pool.query() directly
export function pool(): Pool {
  if (_pool) return _pool;
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL is not set");
  _pool = createPool(DATABASE_URL);
  return _pool;
}

export const sql = query;
export default query;