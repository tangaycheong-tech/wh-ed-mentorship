"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ mentors: 0, mentees: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/admin/assignments").then(r => r.json()),
    ]).then(([usersData, assignmentsData]) => {
      if (usersData.success) {
        const mentors = usersData.data.filter((u: any) => u.role === "mentor").length;
        const mentees = usersData.data.filter((u: any) => u.role === "mentee").length;
        setStats({ mentors, mentees, assignments: assignmentsData.success ? assignmentsData.data.length : 0 });
      }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Admin Dashboard</h2>
      <p className="text-slate-600 mb-8">Manage users, assignments, and monitor program progress.</p>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-slate-700 text-white rounded-xl p-6"><p className="text-4xl font-bold">{stats.mentors}</p><p className="text-sm text-slate-300 mt-1">Mentors</p></div>
        <div className="bg-slate-600 text-white rounded-xl p-6"><p className="text-4xl font-bold">{stats.mentees}</p><p className="text-sm text-slate-300 mt-1">Mentees</p></div>
        <div className="bg-teal-600 text-white rounded-xl p-6"><p className="text-4xl font-bold">{stats.assignments}</p><p className="text-sm text-teal-100 mt-1">Active Pairings</p></div>
        <div className="bg-indigo-600 text-white rounded-xl p-6"><p className="text-4xl font-bold">—</p><p className="text-sm text-indigo-100 mt-1">Checklists</p></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/admin/users" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition"><h3 className="font-semibold text-slate-800 mb-1">Manage Users</h3><p className="text-sm text-slate-500">Add, edit, or deactivate user accounts.</p></Link>
        <Link href="/dashboard/admin/assignments" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition"><h3 className="font-semibold text-slate-800 mb-1">Pair Assignments</h3><p className="text-sm text-slate-500">Assign mentors to mentees.</p></Link>
        <Link href="/dashboard/admin/overview" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition"><h3 className="font-semibold text-slate-800 mb-1">Program Overview</h3><p className="text-sm text-slate-500">Monitor progress across all pairs.</p></Link>
      </div>
    </div>
  );
}