"use client";
import { useEffect, useState } from "react";

export default function AdminOverviewPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/assignments").then(r => r.json()).then(d => { if (d.success) setAssignments(d.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Program Overview</h2>
      {assignments.length === 0 ? (
        <div className="text-center text-slate-400 py-12">No active mentor-mentee pairs yet.</div>
      ) : (
        <div className="space-y-4">
          {assignments.map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-semibold text-teal-700">Mentor: {a.mentor_name}</span>
                <span className="text-slate-300">→</span>
                <span className="font-semibold text-indigo-700">Mentee: {a.mentee_name}</span>
                <span className={`ml-auto text-xs px-2 py-0.5 rounded ${a.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{a.status}</span>
              </div>
              <p className="text-xs text-slate-400">Paired since {new Date(a.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}