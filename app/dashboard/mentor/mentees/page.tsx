"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Mentee { id: string; name: string; email: string; created_at: string; }

export default function MenteesPage() {
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mentor/mentees").then(r => r.json()).then(data => {
      if (data.success) setMentees(data.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">My Mentees</h2>
      {mentees.length === 0 ? (
        <div className="text-center text-slate-500 py-12">No mentees assigned yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mentees.map(m => (
            <div key={m.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <h4 className="font-semibold text-slate-800">{m.name}</h4>
              <p className="text-sm text-slate-500 mb-3">{m.email}</p>
              <div className="flex gap-2">
                <Link href={`/dashboard/mentor/mentees/${m.id}`} className="text-sm bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">Manage Checklists</Link>
                <Link href={`/dashboard/mentor/reflections?mentee=${m.id}`} className="text-sm border border-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-50">Reflections</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}