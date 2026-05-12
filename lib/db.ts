// lib/db.ts — Fixed with IPv6 bypass
import { Pool } from "pg";

// Lazy singleton — sync access to the resolved pool
let _pool: Pool | null = null;
let _poolPromise: Promise<Pool> | null = null;

function createPool(databaseUrl: string): Pool {
  // Always use direct params to avoid URL parsing issues
  // Format: postgresql://postgres:password@[ipv6]:5432/postgres
  // or postgresql://postgres:password@hostname:5432/postgres

  const url = new URL(databaseUrl);
  const hostname = url.hostname;

  // Check if hostname is a bracketed IPv6 address
  const isBracketedIPv6 = hostname.startsWith("[") && hostname.includes("]:");

  // Check if hostname is a bare IPv6 (colons but no dots/TLD)
  const isBareIPv6 = /^[0-9a-fA-F:]+$/.test(hostname) && hostname.includes(":");

  if (isBracketedIPv6 || isBareIPv6) {
    const ipv6 = hostname.replace(/^\[|\]:\d+$/g, "");
    const port = parseInt(url.port || "5432", 10);
    return new Pool({
      host: ipv6,
      port,
      user: url.username,
      password: decodeURIComponent(url.password),
      database: url.pathname.replace(/^\//, ""),
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
    });
  }

  // Regular hostname
  return new Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000,
  });
}

async function getPool(): Promise<Pool> {
  if (_pool) return _pool;

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  _pool = createPool(DATABASE_URL);
  return _pool;
}

export async function query<T = Record<string, unknown>>(
  strings: TemplateStringsArray | string,
  ...values: unknown[]
): Promise<T[]> {
  const pool = await getPool();
  let text: string;
  let params: unknown[];

  if (typeof strings === "string") {
    text = strings;
    params = Array.isArray(values[0]) ? values[0] : values;
  } else {
    text = strings.reduce((acc, str, i) => {
      return acc + str + (values[i] !== undefined ? `$${i + 1}` : "");
    }, "");
    params = values;
  }

  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Sync pool accessor — callers use `pool.query()` synchronously
// On first call, initialises pool (sync) using DATABASE_URL env var
export function pool(): Pool {
  if (_pool) return _pool;
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) throw new Error("DATABASE_URL environment variable is not set");
  _pool = createPool(DATABASE_URL);
  return _pool;
}

export const sql = query;
export default query;
