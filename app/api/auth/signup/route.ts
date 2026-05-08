// ============================================================
// app/api/auth/signup/route.ts — POST /api/auth/signup
// ============================================================

import { NextResponse } from "next/server";
import { registerUser, setSessionCookie } from "@/lib/auth";
import type { SessionUser, UserRole } from "@/types";

const VALID_ROLES: UserRole[] = ["mentor", "mentee", "admin"];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name, role } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    const result = await registerUser({ email, password, name, role });

    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || "Registration failed" },
        { status: 409 }
      );
    }

    const sessionUser: SessionUser = {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
    };

    await setSessionCookie(sessionUser);

    return NextResponse.json(
      { success: true, user: result.user },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
