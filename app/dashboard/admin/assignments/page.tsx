"use client";
import { useEffect, useState } from "react";

interface User { id: string; name: string; email: string; role: string; }
interface Assignment { id: string; mentor_name: string; mentor_email: string; mentee_name: string; mentee_email: string; status: string; created_at: string; }

export default function AdminAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [users, setUsers] = useState<{mentors: User[]; mentees: User[]}>({mentors: [], mentees: []});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ mentor_id: "", mentee_id: "" });

  const load = () => Promise.all([
    fetch("/api/admin/assignments").then(r => r.json()),
    fetch("/api/admin/users").then(r => r.json()),
  ]).then(([aData, uData]) => {
    if (aData.success) setAssignments(aData.data);
    if (uData.success) {
      setUsers({ mentors: uData.data.filter((u: User) => u.role === "mentor"), mentees: uData.data.filter((u: User) => u.role === "mentee") });
    }
    setLoading(false);
  });

  useEffect(() => { load(); }, []);

  const createAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ mentor_id: "", mentee_id: "" }); setShowForm(false); load();
  };

  const deleteAssignment = async (id: string) => { if (confirm("Remove this pairing?")) await fetch(`/api/admin/assignments/${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Mentor-Mentee Pairings</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">{showForm ? "Cancel" : "+ New Pairing"}</button>
      </div>

      {showForm && (
        <form onSubmit={createAssignment} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <select value={form.mentor_id} onChange={e => setForm({...form, mentor_id: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Mentor</option>
              {users.mentors.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={form.mentee_id} onChange={e => setForm({...form, mentee_id: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required>
              <option value="">Select Mentee</option>
              {users.mentees.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <button type="submit" className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 text-sm">Create Pairing</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left px-4 py-3 text-slate-600">Mentor</th><th className="text-left px-4 py-3 text-slate-600">Mentee</th><th className="text-left px-4 py-3 text-slate-600">Status</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>{assignments.length === 0 ? <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No pairings yet.</td></tr> : assignments.map(a => (
            <tr key={a.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3"><div className="font-medium text-slate-800">{a.mentor_name}</div><div className="text-xs text-slate-400">{a.mentor_email}</div></td>
              <td className="px-4 py-3"><div className="font-medium text-slate-800">{a.mentee_name}</div><div className="text-xs text-slate-400">{a.mentee_email}</div></td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${a.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>{a.status}</span></td>
              <td className="px-4 py-3 text-right"><button onClick={() => deleteAssignment(a.id)} className="text-red-500 hover:text-red-700 text-xs">Remove</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}