"use client";
import { useEffect, useState } from "react";

interface Reflection { id: string; title: string; content: string; mood: string; is_private: boolean; created_at: string; user_name: string; }

export default function MentorReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/reflections").then(r => r.json()).then(d => { if (d.success) setReflections(d.data); setLoading(false); });
  }, []);

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Reflections</h2>
      {reflections.length === 0 ? <div className="text-center text-slate-400 py-12">No reflections yet.</div> : (
        <div className="space-y-4">
          {reflections.map(r => (
            <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-slate-800">{r.title}</h3>
                {r.mood && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{r.mood}</span>}
              </div>
              <p className="text-sm text-slate-600 mb-2">{r.content}</p>
              <p className="text-xs text-slate-400">{r.user_name} • {new Date(r.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}