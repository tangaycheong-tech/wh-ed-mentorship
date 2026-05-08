// ============================================================
// app/api/auth/login/route.ts — POST /api/auth/login
// ============================================================

import { NextResponse } from "next/server";
import { loginUser, setSessionCookie } from "@/lib/auth";
import type { SessionUser } from "@/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    const result = await loginUser({ email, password });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    const sessionUser: SessionUser = {
      id: result.user!.id,
      email: result.user!.email,
      name: result.user!.name,
      role: result.user!.role,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json(
      { success: true, data: { user: result.user } },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
