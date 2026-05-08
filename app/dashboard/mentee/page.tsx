"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function MenteeDashboard() {
  const [user, setUser] = useState<{name:string}|null>(null);
  const [stats, setStats] = useState({ goals: 0, reflections: 0 });

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then(r => r.json()),
      fetch("/api/goals").then(r => r.json()),
      fetch("/api/reflections").then(r => r.json()),
    ]).then(([meData, goalsData, reflData]) => {
      if (meData.user) setUser(meData.user);
      if (goalsData.success) setStats(s => ({ ...s, goals: goalsData.data.length }));
      if (reflData.success) setStats(s => ({ ...s, reflections: reflData.data.length }));
    });
  }, []);

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-2">Mentee Dashboard</h2>
      <p className="text-slate-600 mb-8">Welcome, {user?.name}. Track your goals, reflections, and progress below.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <p className="text-4xl font-bold text-indigo-700">{stats.goals}</p>
          <p className="text-sm text-indigo-600 mt-1">Active Goals</p>
        </div>
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-6">
          <p className="text-4xl font-bold text-teal-700">{stats.reflections}</p>
          <p className="text-sm text-teal-600 mt-1">Reflections Written</p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/mentee/goals" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-800 mb-1">My Goals</h3>
          <p className="text-sm text-slate-500">Set and track SMART goals for your development.</p>
        </Link>
        <Link href="/dashboard/mentee/reflections" className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md transition">
          <h3 className="font-semibold text-slate-800 mb-1">Reflections</h3>
          <p className="text-sm text-slate-500">Write and review learning reflections.</p>
        </Link>
      </div>
    </div>
  );
}