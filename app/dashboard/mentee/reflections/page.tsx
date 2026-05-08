"use client";
import { useEffect, useState } from "react";

interface Reflection { id: string; title: string; content: string; mood: string; is_private: boolean; created_at: string; }

export default function MenteeReflectionsPage() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", mood: "", is_private: true });

  const load = () => fetch("/api/reflections").then(r => r.json()).then(d => { if (d.success) setReflections(d.data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const createReflection = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/reflections", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ title: "", content: "", mood: "", is_private: true }); setShowForm(false); load();
  };

  const moods = ["😊 Great", "😐 Okay", "😔 Struggling", "💪 Energized", "😴 Tired"];

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">My Reflections</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">{showForm ? "Cancel" : "+ Write Reflection"}</button>
      </div>

      {showForm && (
        <form onSubmit={createReflection} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Title (e.g. Week 3 Learning)" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm" required />
          <textarea value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="What did you learn? What challenged you?" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm h-32" required />
          <div className="flex gap-4 mb-3">
            <select value={form.mood} onChange={e => setForm({...form, mood: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="">Select mood</option>
              {moods.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.is_private} onChange={e => setForm({...form, is_private: e.target.checked})} className="w-4 h-4" />
              Private (only you can see)
            </label>
          </div>
          <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">Save Reflection</button>
        </form>
      )}

      {reflections.length === 0 && !showForm && <div className="text-center text-slate-400 py-12">No reflections yet. Write your first reflection.</div>}

      {reflections.map(r => (
        <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-slate-800">{r.title}</h3>
            <div className="flex gap-2">
              {r.mood && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{r.mood}</span>}
              {r.is_private && <span className="text-xs bg-amber-50 px-2 py-1 rounded text-amber-600">Private</span>}
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-2">{r.content}</p>
          <p className="text-xs text-slate-400">{new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
}