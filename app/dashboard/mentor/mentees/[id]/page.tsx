"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Checklist { id: string; title: string; description: string; created_at: string; checklist_items?: ChecklistItem[]; }
interface ChecklistItem { id: string; content: string; is_completed: boolean; order_index: number; }

export default function MenteeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newItems, setNewItems] = useState("");

  const load = () => fetch(`/api/mentor/mentees/${id}`).then(r => r.json()).then(d => { if (d.success) setChecklists(d.data); setLoading(false); });

  useEffect(() => { load(); }, [id]);

  const createChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/checklists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle, items: newItems.split("\n").filter(Boolean).map(content => ({ content })), mentee_id: id }),
    });
    setNewTitle(""); setNewItems(""); setShowForm(false); load();
  };

  const toggleItem = async (itemId: string, current: boolean) => {
    await fetch(`/api/checklist-items/${itemId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_completed: !current }) });
    load();
  };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-4xl">
      <h2 className="text-2xl font-bold text-slate-800 mb-8">Manage Checklists</h2>
      <button onClick={() => setShowForm(!showForm)} className="mb-6 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">
        {showForm ? "Cancel" : "+ New Checklist"}
      </button>

      {showForm && (
        <form onSubmit={createChecklist} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Checklist title (e.g. Week 1 Orientation)" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm" required />
          <textarea value={newItems} onChange={e => setNewItems(e.target.value)} placeholder="One item per line (e.g. Complete orientation paperwork)" className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3 text-sm h-32" />
          <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">Create Checklist</button>
        </form>
      )}

      {checklists.length === 0 && !showForm && <div className="text-center text-slate-400 py-12">No checklists yet. Create one to get started.</div>}

      {checklists.map(cl => (
        <div key={cl.id} className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
          <h3 className="font-semibold text-slate-800 mb-1">{cl.title}</h3>
          <p className="text-xs text-slate-400 mb-3">{new Date(cl.created_at).toLocaleDateString()}</p>
          <div className="space-y-2">
            {(cl.checklist_items || []).map(item => (
              <label key={item.id} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={item.is_completed} onChange={() => toggleItem(item.id, item.is_completed)} className="w-4 h-4 rounded border-slate-300 text-teal-600" />
                <span className={item.is_completed ? "line-through text-slate-400" : "text-slate-700"}>{item.content}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}