"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SetupPage() {
  const router = useRouter();
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";

  const [secret, setSecret] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (BYPASS) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-xl font-black text-primary">Setup</div>
        <div className="text-sm text-secondary mt-2">
          Dev bypass is enabled — setup is not needed.
        </div>
      </div>
    );
  }

  const run = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/bootstrap", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret,
          email: "adminb@livesoccerr.com",
          password,
        }),
      });

      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Failed");

      setMsg("Owner created. Now login with adminb@livesoccerr.com");
      setTimeout(() => router.push("/login"), 800);
    } catch (e: any) {
      setMsg(e?.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-xl font-black text-primary">Initial Setup</div>
        <div className="text-sm text-secondary mt-1">
          This creates the first owner: <b>adminb@livesoccerr.com</b>
        </div>

        {msg ? <div className="mt-4 text-sm text-secondary">{msg}</div> : null}

        <div className="mt-6 space-y-3">
          <div>
            <label className="text-xs font-black text-secondary">Bootstrap Secret</label>
            <input
              className="mt-1 w-full theme-border border rounded-lg px-3 py-2 theme-bg text-primary"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="ADMIN_BOOTSTRAP_SECRET"
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Owner Password</label>
            <input
              type="password"
              className="mt-1 w-full theme-border border rounded-lg px-3 py-2 theme-bg text-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a strong password"
            />
          </div>

          <button
            type="button"
            disabled={busy || !secret || !password}
            onClick={run}
            className="w-full rounded-lg px-4 py-2 font-black bg-[#0f80da] text-white disabled:opacity-60"
          >
            {busy ? "Creating..." : "Create Owner"}
          </button>
        </div>
      </div>
    </div>
  );
}
