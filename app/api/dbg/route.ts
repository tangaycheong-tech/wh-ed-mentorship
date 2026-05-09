// TEMP DIAGNOSTIC - DELETE AFTER USE
// GET /api/dbg?test=bcrypt - test bcryptjs
// GET /api/dbg?test=db - test DB connection

import { NextResponse } from "next/server";
import sql from "@/lib/db";
import * as bcrypt from "bcryptjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const test = searchParams.get("test");

  try {
    if (test === "bcrypt") {
      const hash = bcrypt.hashSync("test1234", 10);
      const compare1 = bcrypt.compareSync("test1234", hash);
      const compare2 = bcrypt.compareSync("wrong", hash);
      return NextResponse.json({
        bcrypt: "OK",
        hashLength: hash.length,
        compareMatch: compare1,
        compareMismatch: compare2
      });
    }

    if (test === "db") {
      const rows = await sql`SELECT 1 AS test` as any[];
      return NextResponse.json({ db: "OK", rows: rows.length });
    }

    if (test === "full") {
      // Test full user flow: insert -> select -> compare -> delete
      const email = `dbg_${Date.now()}@test.com`;
      const hash = bcrypt.hashSync("test1234", 10);
      
      const insert = await sql`
        INSERT INTO users (email, password_hash, name, role)
        VALUES (${email}, ${hash}, 'Debug User', 'mentee')
        RETURNING id, email, name
      ` as any[];
      
      const rows = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}` as any[];
      
      const compareOk = bcrypt.compareSync("test1234", rows[0].password_hash);
      const compareFail = bcrypt.compareSync("wrong", rows[0].password_hash);

      // Clean up
      await sql`DELETE FROM users WHERE email = ${email}`;
      
      return NextResponse.json({
        insert: insert[0],
        select: { id: rows[0].id, email: rows[0].email },
        compareMatch: compareOk,
        compareMismatch: compareFail
      });
    }

    return NextResponse.json({ error: "unknown test" }, { status: 400 });
  } catch (err: any) {
    console.error("DBG error:", err);
    return NextResponse.json(
      { error: err.message, stack: err.stack?.split("\n").slice(0, 5) },
      { status: 500 }
    );
  }
}