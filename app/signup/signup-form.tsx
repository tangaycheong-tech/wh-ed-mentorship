// ============================================================
// app/signup/signup-form.tsx — Client-side signup form
// ============================================================

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { UserRole } from "@/types";

const ROLES: { value: UserRole; label: string }[] = [
  { value: "mentee", label: "Mentee — I want to learn from a mentor" },
  { value: "mentor", label: "Mentor — I want to guide and teach others" },
];

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedRole = searchParams.get("role") as UserRole | null;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(
    preselectedRole === "mentor" || preselectedRole === "mentee"
      ? preselectedRole
      : "mentee"
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        setError(json.error || "Signup failed");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Full name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
          placeholder="Jane Smith"
        />
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
          placeholder="you@example.com"
        />
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 mb-1"
        >
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-colors"
          placeholder="At least 8 characters"
        />
      </div>

      {/* Role selection */}
      <fieldset>
        <legend className="block text-sm font-medium text-slate-700 mb-3">
          I want to join as a…
        </legend>
        <div className="space-y-3">
          {ROLES.map(({ value, label }) => (
            <label
              key={value}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                role === value
                  ? "border-blue-500 bg-blue-50 ring-1 ring-blue-500"
                  : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={value}
                checked={role === value}
                onChange={() => setRole(value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}
