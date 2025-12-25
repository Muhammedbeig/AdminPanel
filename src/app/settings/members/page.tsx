"use client";

import React, { useEffect, useState } from "react";
import type { Role } from "@prisma/client";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type Row = { id: number; email: string; role: Role; createdAt?: string };

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function MembersPage() {
  const { user, loading } = useAdminAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [err, setErr] = useState<string>("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("ADMIN" as Role);
  const [saving, setSaving] = useState(false);

  async function load() {
    setErr("");
    const res = await fetch("/api/admin/members", { method: "GET" });
    const json = await safeJson(res);

    if (!res.ok || !json?.ok) {
      setRows([]);
      setErr(json?.error || "Failed to load members");
      return;
    }
    setRows(json.users || []);
  }

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  if (loading) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Please login.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-lg font-black text-primary">Members</div>
        <div className="text-sm text-secondary">Create and manage admin users.</div>

        {err ? <div className="text-sm text-red-500 mt-3">{err}</div> : null}

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="new@domain.com"
          />
          <input
            className="w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            type="password"
          />
          <select
            className="w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            <option value={"ADMIN"}>ADMIN</option>
            <option value={"EDITOR"}>EDITOR</option>
            <option value={"SEO_MANAGER"}>SEO_MANAGER</option>
            <option value={"VIEWER"}>VIEWER</option>
          </select>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button
            className="rounded-2xl px-4 py-2.5 font-black bg-[#0f80da] text-white disabled:opacity-60"
            disabled={saving || !email.trim() || !password.trim()}
            onClick={async () => {
              setSaving(true);
              setErr("");
              try {
                const res = await fetch("/api/admin/members", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({ email, password, role }),
                });
                const json = await safeJson(res);
                if (!res.ok || !json?.ok) {
                  setErr(json?.error || "Failed to create member");
                  return;
                }
                setEmail("");
                setPassword("");
                await load();
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Creating…" : "Create Member"}
          </button>

          <button
            className="rounded-2xl px-4 py-2.5 font-black theme-border border text-primary"
            onClick={load}
            disabled={saving}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm font-black text-primary">Existing Members</div>
        <div className="mt-3 space-y-2">
          {rows.map((r) => (
            <div key={r.id} className="theme-border border rounded-xl p-3 flex items-center gap-3">
              <div className="min-w-0">
                <div className="text-sm font-black text-primary truncate">{r.email}</div>
                <div className="text-xs text-secondary">{r.role}</div>
              </div>
              <div className="ml-auto text-xs text-secondary">#{r.id}</div>
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-secondary">No members found.</div> : null}
        </div>
      </div>
    </div>
  );
}
