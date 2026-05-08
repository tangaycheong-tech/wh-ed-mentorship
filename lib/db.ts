// ============================================================
// lib/db.ts — Neon serverless database client (Supabase PG)
// Lazy initialization to avoid build-time connection attempts
// ============================================================

import { neon, neonConfig } from "@neondatabase/serverless";

// Lazy singleton — only initialized on first use, not at module load
let _sql: ReturnType<typeof neon> | null = null;

function getSql() {
  if (_sql) return _sql;

  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  // WebSocket polyfill only needed in Node.js (not edge)
  if (typeof window === "undefined" && typeof WebSocket !== "undefined") {
    try {
      neonConfig.webSocketConstructor = WebSocket as unknown as typeof globalThis.WebSocket;
    } catch {
      // Ignore if not available
    }
  }

  _sql = neon(DATABASE_URL);
  return _sql;
}

// Export a proxy that lazily initializes the client
const sql = new Proxy({} as ReturnType<typeof neon>, {
  get(_target, prop) {
    const client = getSql();
    const value = (client as unknown as Record<string, unknown>)[prop as string];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export { sql };
export default sql;