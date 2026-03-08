"use client";

import { useEffect, useState } from "react";

function LoginForm() {
  const [callbackUrl, setCallbackUrl] = useState("/dashboard");
  const [email, setEmail] = useState("supervisor@example.com");
  const [password, setPassword] = useState("supervisor123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setCallbackUrl(params.get("callbackUrl") || "/dashboard");
    const err = params.get("error");
    if (err === "CredentialsSignin" || err === "invalid") {
      setError("Invalid email or password. Use the demo credentials below.");
    } else if (err === "missing") {
      setError("Please enter email and password.");
    }
  }, []);

  const submit = (e: React.FormEvent) => {
    setError("");
    setLoading(true);
    // Let the form submit normally so server can set cookie and redirect
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/5 bg-[#0a0a0a] p-8 shadow-xl">
        <h1 className="text-2xl font-bold" style={{ color: "#e8e8e8", textShadow: "0 0 12px rgba(192, 192, 192, 0.35)" }}>Sign in</h1>
        <p className="mt-1 text-sm text-slate-400">Use one account for workers and supervisors — no separate login.</p>
        <form action="/api/login" method="post" onSubmit={submit} className="mt-6 space-y-4">
          <input type="hidden" name="callbackUrl" value={callbackUrl} />
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
              placeholder="e.g. supervisor@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-400">Password</label>
            <input
              type="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl py-3 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-6 text-xs text-slate-500">
          Demo: supervisor@example.com / supervisor123 · worker@example.com / worker123
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return <LoginForm />;
}
