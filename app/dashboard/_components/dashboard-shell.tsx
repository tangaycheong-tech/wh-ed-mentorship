// ============================================================
// app/dashboard/_components/dashboard-shell.tsx
// Client component: sidebar nav + user menu + mobile toggle
// ============================================================

"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/types";
import { cn, initials } from "@/lib/utils";

// ---- Role-based nav items ---------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

function getNavItems(role: string): NavItem[] {
  if (role === "mentor") {
    return [
      { href: "/dashboard/mentor", label: "Overview", icon: "📋" },
    ];
  }
  if (role === "mentee") {
    return [
      { href: "/dashboard/mentee", label: "Overview", icon: "🌱" },
    ];
  }
  if (role === "admin") {
    return [
      { href: "/dashboard/admin", label: "Admin Panel", icon: "⚙️" },
    ];
  }
  return [];
}

// ---- Component --------------------------------------------------

export function DashboardShell({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = getNavItems(user.role);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---- Sidebar ---- */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200",
          "transform transition-transform duration-200 ease-in-out",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-slate-200">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">WH</span>
            </div>
            <span className="text-lg font-bold text-slate-900">WH-ED</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-slate-600 text-xl leading-none"
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                {initials(user.name)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 bg-white">
          <Link
            href="/"
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors mb-1"
          >
            <span className="text-lg">🏠</span>
            Home
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <span className="text-lg">🚪</span>
            Sign out
          </button>
        </div>
      </aside>

      {/* ---- Main content area ---- */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex items-center h-16 px-4 bg-white border-b border-slate-200 lg:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-600 hover:text-slate-900 p-1 -ml-1"
            aria-label="Open sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <span className="ml-3 text-lg font-bold text-slate-900">WH-ED</span>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
