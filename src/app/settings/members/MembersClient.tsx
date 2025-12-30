"use client";

import React, { useEffect, useState } from "react";
import { Trash2, UserPlus, ShieldAlert } from "lucide-react";
import { useAdminAuth, AdminRole } from "@/components/admin/auth/AdminAuthProvider";

type Member = {
  id: number;
  email: string;
  role: AdminRole;
  createdAt: string;
};

const ROLES: AdminRole[] = ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER", "DEVELOPER"];

export default function MembersClient() {
  const { user: currentUser } = useAdminAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Add Member State
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("EDITOR");
  const [adding, setAdding] = useState(false);

  async function loadMembers() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/members");
      const data = await res.json();
      if (data.ok) setMembers(data.members);
      else throw new Error(data.error);
    } catch (e: any) {
      setError(e.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMembers();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setAdding(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPass, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNewEmail("");
      setNewPass("");
      loadMembers(); 
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Delete failed");
      
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } catch (e: any) {
      alert(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-primary">Team Members</h1>
        <p className="text-sm text-secondary">Manage access and roles for the admin panel.</p>
      </div>

      {/* Add Member Form */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Add New Member</h3>
        <form onSubmit={handleAdd} className="flex flex-col md:flex-row gap-3 items-end">
          <div className="w-full">
            <label className="text-xs font-bold text-secondary mb-1 block">Email</label>
            <input 
              required
              type="email" 
              className="w-full px-3 py-2 rounded-lg theme-border border bg-transparent text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
            />
          </div>
          <div className="w-full">
            <label className="text-xs font-bold text-secondary mb-1 block">Password</label>
            <input 
              required
              type="password" 
              className="w-full px-3 py-2 rounded-lg theme-border border bg-transparent text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
            />
          </div>
          <div className="w-full md:w-64">
            <label className="text-xs font-bold text-secondary mb-1 block">Role</label>
            <select 
              className="w-full px-3 py-2 rounded-lg theme-border border bg-transparent text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50"
              value={newRole}
              onChange={e => setNewRole(e.target.value as AdminRole)}
            >
              {ROLES.map(r => <option key={r} value={r} className="text-black">{r}</option>)}
            </select>
          </div>
          <button 
            disabled={adding}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {adding ? "Adding..." : <><UserPlus size={16} /> Add</>}
          </button>
        </form>
      </div>

      {/* Members List */}
      <div className="theme-bg theme-border border rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* Kept border-b here to separate header from body, but removed divide-y below */}
            <tr className="bg-gray-50/5 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase tracking-widest">
              <th className="p-4">ID</th>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          {/* ✅ REMOVED 'divide-y' class from here */}
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="p-8 text-center text-secondary">Loading members...</td></tr>
            ) : members.map((m) => {
              const isMainAdmin = m.id === 1;
              const isSelf = currentUser?.id === m.id;
              const canDelete = !isMainAdmin && !isSelf;

              return (
                <tr key={m.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 text-sm font-mono text-secondary">#{m.id}</td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-primary">{m.email}</div>
                    <div className="text-xs text-secondary opacity-60">Joined: {new Date(m.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td className="p-4">
                    <span className={`
                      inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider
                      ${m.role === "ADMIN" || m.role === "DEVELOPER" ? "bg-blue-500/10 text-blue-500" : "bg-gray-500/10 text-gray-500"}
                    `}>
                      {m.role === "ADMIN" && <ShieldAlert size={10} />}
                      {m.role}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {canDelete ? (
                      <button 
                        onClick={() => handleDelete(m.id)}
                        className="p-2 text-red-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : (
                      <div className="p-2 text-secondary opacity-20 cursor-not-allowed inline-block">
                        <Trash2 size={16} />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}