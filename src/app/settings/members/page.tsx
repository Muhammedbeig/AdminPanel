"use client";

import { useEffect, useMemo, useState } from "react";
import { firebaseAuth } from "@/lib/firebase/firebase-client";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type AdminRole = "owner" | "admin" | "editor" | "viewer";
type Member = { uid: string; email: string; role: AdminRole; createdAt?: string };

export default function MembersPage() {
  const { role, roleLoading, refreshClaims } = useAdminAuth();
  const canManage = role === "owner" || role === "admin";

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [newRole, setNewRole] = useState<AdminRole>("editor");
  const [tempPass, setTempPass] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const token = useMemo(async () => {
    const u = firebaseAuth.currentUser;
    if (!u) return "";
    return u.getIdToken(true);
  }, []);

  const load = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await refreshClaims();
      const t = await token;
      const res = await fetch("/api/admin/members", {
        headers: { authorization: `Bearer ${t}` },
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setMembers(data.users || []);
    } catch (e: any) {
      setMsg(e?.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMember = async () => {
    setMsg(null);
    setTempPass(null);
    try {
      const t = await token;
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${t}` },
        body: JSON.stringify({ email, role: newRole }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");
      setTempPass(data.tempPassword || null);
      setEmail("");
      await load();
    } catch (e: any) {
      setMsg(e?.message || "Failed to add member");
    }
  };

  if (roleLoading) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Loading permissions…</div>
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-xl font-black text-primary">Members</div>
        <div className="text-sm text-secondary mt-2">Access denied.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-xl font-black text-primary">Members & Roles</div>
        <div className="text-sm text-secondary mt-1">
          Add members and assign roles. (CMS + advanced permissions coming soon)
        </div>

        {msg ? <div className="mt-4 text-sm text-red-500">{msg}</div> : null}
        {tempPass ? (
          <div className="mt-4 text-sm text-secondary">
            Temp password for new user: <b className="text-primary">{tempPass}</b>
          </div>
        ) : null}

        <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_180px_140px] gap-2">
          <input
            className="theme-border border rounded-lg px-3 py-2 theme-bg text-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@email.com"
          />
          <select
            className="theme-border border rounded-lg px-3 py-2 theme-bg text-primary"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as AdminRole)}
          >
            <option value="owner">owner</option>
            <option value="admin">admin</option>
            <option value="editor">editor</option>
            <option value="viewer">viewer</option>
          </select>
          <button
            className="rounded-lg px-4 py-2 font-black bg-[#0f80da] text-white disabled:opacity-60"
            disabled={!email}
            onClick={addMember}
          >
            Add
          </button>
        </div>
      </div>

      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="text-sm font-black text-primary">Current members</div>
          <button
            className="text-sm font-black text-secondary hover:text-primary"
            onClick={load}
            disabled={loading}
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {members.map((m) => (
            <div
              key={m.uid}
              className="theme-border border rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="min-w-0">
                <div className="text-sm font-black text-primary truncate">{m.email}</div>
                <div className="text-xs text-secondary">Role: {m.role}</div>
              </div>
              <div className="text-xs text-secondary">{m.uid.slice(0, 10)}…</div>
            </div>
          ))}
          {!members.length && !loading ? (
            <div className="text-sm text-secondary">No members found.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
