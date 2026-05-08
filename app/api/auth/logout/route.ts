// ============================================================
// app/api/auth/logout/route.ts — POST /api/auth/logout
// ============================================================

import { NextResponse } from "next/server";
import { removeSessionCookie } from "@/lib/auth";

export async function POST() {
  try {
    await removeSessionCookie();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: "Logout failed" },
      { status: 500 }
    );
  }
}
