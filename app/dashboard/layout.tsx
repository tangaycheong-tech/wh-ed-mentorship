"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface SessionUser { id: string; email: string; name: string; role: "mentor" | "mentee" | "admin"; }

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user) { router.push("/login"); return; }
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => { router.push("/login"); });
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="text-slate-500">Loading...</div></div>;
  if (!user) return null;

  const roleColors: Record<string, string> = { mentor: "bg-teal-500", mentee: "bg-indigo-500", admin: "bg-slate-600" };
  const roleBgNav: Record<string, string> = { mentor: "text-teal-700", mentee: "text-indigo-700", admin: "text-slate-700" };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-slate-800">WH ED Mentorship</h1>
          <span className={`text-xs px-2 py-1 rounded text-white ${roleColors[user.role]}`}>{user.role.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600">{user.name}</span>
          <button onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); router.push("/login"); }} className="text-sm text-red-500 hover:text-red-700">Logout</button>
        </div>
      </nav>
      <div className="flex">
        <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-64px)] p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Navigation</p>
          <nav className="space-y-1">
            <Link href="/dashboard" className="nav-link">Dashboard</Link>
            {user.role === "mentor" && <>
              <Link href="/dashboard/mentor/mentees" className="nav-link">My Mentees</Link>
              <Link href="/dashboard/mentor/checklists" className="nav-link">Checklists</Link>
              <Link href="/dashboard/mentor/reflections" className="nav-link">Reflections</Link>
            </>}
            {user.role === "mentee" && <>
              <Link href="/dashboard/mentee/goals" className="nav-link">My Goals</Link>
              <Link href="/dashboard/mentee/reflections" className="nav-link">Reflections</Link>
            </>}
            {user.role === "admin" && <>
              <Link href="/dashboard/admin/users" className="nav-link">Users</Link>
              <Link href="/dashboard/admin/assignments" className="nav-link">Assignments</Link>
              <Link href="/dashboard/admin/overview" className="nav-link">Overview</Link>
              <Link href="/dashboard/admin/training" className="nav-link">Training</Link>
            </>}
          </nav>
        </aside>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
