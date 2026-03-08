"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useLang } from "@/lib/i18n";
import { useNotifications } from "@/lib/notifications";

const linkKeys = ["citizen", "dashboard", "supervisor", "worker"] as const;

export default function Nav() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { t, lang, setLang } = useLang();
  const { count, clear } = useNotifications();

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#000000] backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10" style={{ boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}>
            <img src="/emblem-logo.png" alt="" className="h-full w-full object-contain p-0.5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white" style={{ fontFamily: "system-ui, sans-serif", textShadow: "0 0 10px rgba(192, 192, 192, 0.35)" }}>
            Grievance<span className="text-slate-300">Router</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            {linkKeys.map((key) => {
              const href = key === "citizen" ? "/" : `/${key}`;
              const active = pathname === href;
              return (
                <Link
                  key={key}
                  href={href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4 ${
                    active ? "bg-white/10 text-slate-200 shadow" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  {t(key)}
                </Link>
              );
            })}
          </div>
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value as "en" | "hi" | "ta" | "te")}
            className="rounded-lg border border-white/10 bg-slate-800/50 px-2 py-1.5 text-sm text-white focus:outline-none"
            title="Language"
          >
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
            <option value="te">తెలుగు</option>
          </select>
          {count > 0 && (
            <button
              onClick={clear}
              className="relative rounded-lg border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-sm text-amber-300"
              title="Notifications"
            >
              🔔 <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-xs text-white">{count}</span>
            </button>
          )}
          <Link href="/#submit" className="rounded-lg px-4 py-2 text-sm font-semibold uppercase tracking-wide text-slate-800 hover:opacity-90" style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 12px rgba(192, 192, 192, 0.35)" }}>
            File a Grievance
          </Link>
          {status === "loading" ? (
            <span className="rounded-lg bg-white/5 px-3 py-1.5 text-sm text-slate-500">…</span>
          ) : session ? (
            <div className="flex items-center gap-2">
              <span className="max-w-[120px] truncate rounded-lg bg-white/5 px-2 py-1.5 text-xs text-slate-400 sm:max-w-[180px]" title={session.user?.email ?? ""}>
                {session.user?.email}
              </span>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-300 hover:bg-white/10"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link href="/login" className="rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-white/5">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
