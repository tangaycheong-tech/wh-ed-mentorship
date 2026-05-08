"use client";
import { useEffect, useState } from "react";

interface User { id: string; email: string; name: string; role: string; created_at: string; }

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "mentee" });

  const load = () => fetch("/api/admin/users").then(r => r.json()).then(d => { if (d.success) setUsers(d.data); setLoading(false); });

  useEffect(() => { load(); }, []);

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setForm({ email: "", password: "", name: "", role: "mentee" }); setShowForm(false); load();
  };

  const deleteUser = async (id: string) => { if (confirm("Delete this user?")) await fetch(`/api/admin/users/${id}`, { method: "DELETE" }); load(); };

  if (loading) return <div className="text-slate-500">Loading...</div>;

  return (
    <div className="max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Users</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">{showForm ? "Cancel" : "+ Add User"}</button>
      </div>

      {showForm && (
        <form onSubmit={createUser} className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Full Name" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
            <input value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" type="email" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required />
            <input value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password (min 8 chars)" type="password" className="border border-slate-300 rounded-lg px-3 py-2 text-sm" required minLength={8} />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-800 text-sm">Create User</button>
        </form>
      )}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200"><tr><th className="text-left px-4 py-3 text-slate-600">Name</th><th className="text-left px-4 py-3 text-slate-600">Email</th><th className="text-left px-4 py-3 text-slate-600">Role</th><th className="text-left px-4 py-3 text-slate-600">Created</th><th className="px-4 py-3"></th></tr></thead>
          <tbody>{users.map(u => (
            <tr key={u.id} className="border-b border-slate-100 last:border-0">
              <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
              <td className="px-4 py-3 text-slate-500">{u.email}</td>
              <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded ${u.role === "admin" ? "bg-slate-700 text-white" : u.role === "mentor" ? "bg-teal-100 text-teal-700" : "bg-indigo-100 text-indigo-700"}`}>{u.role}</span></td>
              <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3 text-right"><button onClick={() => deleteUser(u.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}