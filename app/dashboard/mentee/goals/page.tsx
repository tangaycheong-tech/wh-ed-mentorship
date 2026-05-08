"use client";
import { useEffect, useState } from "react";

interface Goal { id: string; title: string; description: string; status: string; progress: number; target_date: string; created_at: string; }

export default function MenteeGoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", target_date: "" });

  const load = () => fetch("/api/goals").then(r => r.json()).then(d => { if (d.success) setGoals(d.data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", description: "", target_date: "" }); setShowForm(false); load();
  };

  const updateProgress = async (id: string, progress: number) => {
    const status = progress === 100 ? "completed" : progress > 0 ? "in_progress" : "not_started";
    await fetch(`/api/goals/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress, status }) });
    load();
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">My Goals</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">{showForm ? "Cancel" : "+ New Goal"}</button>
      </div>

      {showForm && (
        <form onSubmit={createGoal} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Goal title" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm" required />
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm h-20" />
          <input type="date" value={form.target_date} onChange={e => setForm({...form, target_date: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm" />
          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">Save Goal</button>
        </form>
      )}

      {goals.length === 0 && !showForm && <div className="text-center text-slate-400 py-12">No goals yet. Set your first goal to get started.</div>}

      {goals.map(g => (
        <div key={g.id} className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex justify-between items-start mb-2">
            <div><h3 className="font-semibold text-slate-800">{g.title}</h3>{g.description && <p className="text-sm text-slate-500 mt-1">{g.description}</p>}</div>
            <span className={`text-xs px-2 py-1 rounded ${{not_started:"bg-slate-100 text-slate-600",in_progress:"bg-blue-50 text-blue-700",completed:"bg-green-50 text-green-700",abandoned:"bg-red-50 text-red-700"}[g.status]}`}>{g.status.replace("_"," ")}</span>
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 bg-slate-100 rounded-full h-2"><div className="bg-indigo-500 h-2 rounded-full transition-all" style={{width:`${g.progress}%`}} /></div>
            <span className="text-sm text-slate-500 w-12 text-right">{g.progress}%</span>
          </div>
          <input type="range" min="0" max="100" value={g.progress} onChange={e => updateProgress(g.id, parseInt(e.target.value))} className="w-full mt-2" />
          {g.target_date && <p className="text-xs text-slate-400 mt-2">Target: {new Date(g.target_date).toLocaleDateString()}</p>}
        </div>
      ))}
    </div>
  );
}