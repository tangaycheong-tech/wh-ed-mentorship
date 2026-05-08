"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Mentee { id: string; name: string; email: string; created_at: string; }

export default function MentorDashboard() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{name:string}|null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/mentor/mentees").then(r => r.json()),
    ]).then(([meData, menteesData]) => {
      if (meData.user) setUser(meData.user);
      if (menteesData.success) setMentees(menteesData.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Mentor Dashboard</h2>
      <p className="text-slate-600 mb-8">Welcome, {user?.name}. Manage your mentees, checklists, and reflections below.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <p className="text-4xl font-bold text-teal-700">{mentees.length}</p>
          <p className="text-sm text-teal-600 mt-1">Assigned Mentees</p>
        </div>
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-4xl font-bold text-indigo-700">—</p>
          <p className="text-sm text-indigo-600 mt-1">Active Checklists</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-6">
          <p className="text-4xl font-bold text-slate-700">—</p>
          <p className="text-sm text-slate-600 mt-1">Reflections</p>
        </div>
      </div>

      <h3 className="text-lg font-semibold text-slate-800 mb-4">My Mentees</h3>
      {mentees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500">
          No mentees assigned yet. Ask your admin to assign mentees to you.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentees.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-800">{m.name}</h4>
                <span className="text-xs text-slate-400">{new Date(m.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm text-slate-500 mb-4">{m.email}</p>
              <div className="flex gap-2">
                <Link href={`/dashboard/mentor/mentees/${m.id}`} className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Manage</Link>
                <Link href={`/dashboard/mentor/reflections?mentee=${m.id}`} className="text-sm border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-50">View Reflections</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}