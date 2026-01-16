"use client";

import React, { useEffect, useState, useRef } from "react";
import { 
  Trash2, UserPlus, ShieldAlert, MoreVertical, UserCog, Check, Shield 
} from "lucide-react";
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
  const canManageMembers =
    currentUser?.role === "ADMIN" || currentUser?.role === "DEVELOPER";
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Add Member State
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("EDITOR");
  const [adding, setAdding] = useState(false);

  // ✅ New State for Menu & Modal
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [roleModalUser, setRoleModalUser] = useState<Member | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  useEffect(() => { loadMembers(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!canManageMembers) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, password: newPass, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNewEmail(""); setNewPass(""); loadMembers();
    } catch (e: any) { alert(e.message); } 
    finally { setAdding(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to delete this user? This cannot be undone.")) return;
    try {
      const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Delete failed");
      setMembers((prev) => prev.filter((m) => m.id !== id));
      setMenuOpenId(null); // Close menu
    } catch (e: any) { alert(e.message); }
  }

  // ✅ Handle Role Change
  async function handleChangeRole(newRole: AdminRole) {
    if (!roleModalUser) return;
    try {
      const res = await fetch(`/api/admin/members/${roleModalUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      
      if (res.ok) {
        setMembers(prev => prev.map(m => m.id === roleModalUser.id ? { ...m, role: newRole } : m));
        setRoleModalUser(null); // Close modal
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (e) { alert("Error updating role"); }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-primary">Team Members</h1>
        <p className="text-sm text-secondary">Manage access and permissions.</p>
      </div>

      {/* Add Form */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
          <UserPlus size={18} className="text-blue-500" /> Invite New Member
        </h3>
        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="text-xs font-bold text-secondary uppercase">Email</label>
            <input 
              required type="email" 
              className="w-full mt-1 px-3 py-2 rounded-lg theme-bg theme-border border outline-none focus:ring-2 focus:ring-blue-500/50"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              disabled={!canManageMembers}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase">Password</label>
            <input 
              required type="password" 
              className="w-full mt-1 px-3 py-2 rounded-lg theme-bg theme-border border outline-none focus:ring-2 focus:ring-blue-500/50"
              value={newPass}
              onChange={e => setNewPass(e.target.value)}
              disabled={!canManageMembers}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-secondary uppercase">Role</label>
            <select 
              className="w-full mt-1 px-3 py-2 rounded-lg theme-bg theme-border border outline-none focus:ring-2 focus:ring-blue-500/50"
              value={newRole}
              onChange={e => setNewRole(e.target.value as AdminRole)}
              disabled={!canManageMembers}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button disabled={!canManageMembers || adding} className="py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50">
            {adding ? "Adding..." : "Add Member"}
          </button>
        </form>
      </div>

      {/* List */}
      <div className="theme-bg theme-border border rounded-xl overflow-hidden min-h-[300px]">
        {loading ? <div className="p-8 text-center text-secondary">Loading...</div> : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase">
              <tr>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Joined</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            {/* Removed 'divide-y' to fix black line issue. Used 'border-b theme-border' on rows instead. */}
            <tbody>
              {members.map(m => {
                const canModify =
                  canManageMembers && m.id !== 1 && m.id !== currentUser.id;

                return (
                  <tr key={m.id} className="border-b theme-border last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-primary">{m.email}</div>
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
                    <td className="p-4 text-xs text-secondary font-mono">
                       {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right relative">
                      {canModify ? (
                        <>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === m.id ? null : m.id);
                            }}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-secondary transition-colors"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {/* Dropdown Menu - Uses theme-bg for correct light/dark support */}
                          {menuOpenId === m.id && (
                            <div 
                              ref={menuRef}
                              className="absolute right-4 top-10 w-48 theme-bg theme-border border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right"
                            >
                              <div className="p-1 space-y-0.5">
                                <button
                                  onClick={() => {
                                    setRoleModalUser(m);
                                    setMenuOpenId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-primary hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"
                                >
                                  <UserCog size={14} className="text-blue-500" /> Change Role
                                </button>
                                
                                <button
                                  onClick={() => handleDelete(m.id)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="p-2 text-secondary opacity-20 cursor-not-allowed inline-block">
                          <MoreVertical size={16} />
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ✅ Role Selection Modal - Uses theme-bg */}
      {roleModalUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="theme-bg theme-border border w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b theme-border">
              <h3 className="text-lg font-bold text-primary">Change Role</h3>
              <p className="text-sm text-secondary mt-1">
                Assign a new role to <span className="font-bold text-primary">{roleModalUser.email}</span>.
              </p>
            </div>
            
            <div className="p-2 max-h-[60vh] overflow-y-auto space-y-1">
              {ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => handleChangeRole(r)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-medium transition-all ${
                    roleModalUser.role === r 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 ring-1 ring-blue-500" 
                      : "text-secondary hover:bg-slate-50 dark:hover:bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield size={16} className={roleModalUser.role === r ? "fill-current" : "opacity-50"} />
                    <span>{r}</span>
                  </div>
                  {roleModalUser.role === r && <Check size={16} />}
                </button>
              ))}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-white/5 border-t theme-border flex justify-end">
              <button 
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 text-sm font-bold text-secondary hover:text-primary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
