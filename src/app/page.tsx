"use client";

import { useState, useRef, useEffect } from "react";
import { useLang } from "@/lib/i18n";
import WorkerLiveMap from "@/components/WorkerLiveMap";

export default function HomePage() {
  return (
    <div className="min-h-screen gradient-mesh">
      <Hero />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div id="submit"><SubmitForm /></div>
          <div id="track"><StatusCheck /></div>
        </div>
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-white/5 px-4 py-20 sm:px-6 lg:px-8 min-h-[68vh]">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-400/5 to-transparent" />
      <div
        className="absolute inset-0 bg-no-repeat opacity-[0.48]"
        style={{
          backgroundImage: "url(/emblem-bg.png)",
          backgroundSize: "min(100vw, 800px) auto",
          backgroundPosition: "50% 30%",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-4xl text-center pt-[28vh]">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "system-ui, sans-serif" }}>
          <span style={{ color: "#ffffff", textShadow: "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(192, 192, 192, 0.4)" }}>AI-Powered</span>{" "}
          <span style={{ color: "#ffffff", textShadow: "0 0 20px rgba(255, 255, 255, 0.5), 0 0 40px rgba(192, 192, 192, 0.4)" }}>Grievance Router</span>
        </h1>
        <p className="mt-6 text-lg sm:text-xl" style={{ color: "#e2e8f0", fontFamily: "system-ui, sans-serif" }}>
          Submit your complaint in your words. We route it to the right department, track resolution with SLA accountability.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <a
            href="#submit"
            className="rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-wide text-slate-800 transition hover:opacity-90"
            style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 16px rgba(192, 192, 192, 0.4)" }}
          >
            File Your Grievance
          </a>
          <a
            href="#track"
            className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium uppercase tracking-wide text-white transition hover:bg-white/5"
          >
            Learn More
          </a>
        </div>
      </div>
    </section>
  );
}

function useVoiceToText(setText: React.Dispatch<React.SetStateAction<string>>) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<{
    start: () => void;
    stop: () => void;
    abort: () => void;
  } | null>(null);
  const setTextRef = useRef(setText);
  setTextRef.current = setText;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const win = window as unknown as { SpeechRecognition?: new () => unknown; webkitSpeechRecognition?: new () => unknown };
    const SpeechRecognitionAPI = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;
    setSupported(true);
    type ResultList = { length: number; item: (i: number) => { item: (j: number) => { transcript: string }; isFinal: boolean } };
    const rec = new SpeechRecognitionAPI() as {
      start: () => void;
      stop: () => void;
      abort: () => void;
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (e: { results: ResultList }) => void;
      onend: () => void;
      onerror: (e: { error: string }) => void;
    };
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-IN";
    rec.onresult = (e: { results: ResultList }) => {
      const r = e.results;
      const lastIdx = r.length - 1;
      if (lastIdx < 0) return;
      const last = r.item(lastIdx);
      const transcript = last.item(0).transcript;
      if (last.isFinal && transcript.trim()) {
        setTextRef.current((prev) => (prev ? prev + " " + transcript : transcript).trim());
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = (e: { error: string }) => {
      setListening(false);
      if (e.error === "not-allowed" || e.error === "aborted") setError(null);
      else if (e.error === "network") setError("Voice needs Chrome and internet. Type your issue instead.");
      else setError(e.error);
    };
    recognitionRef.current = rec;
    return () => {
      try {
        rec.abort();
      } catch (_) {}
    };
  }, []);

  const toggle = () => {
    setError(null);
    if (!recognitionRef.current) return;
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch (err) {
        setError("Could not start microphone");
      }
    }
  };
  return { listening, toggle, supported, error };
}

function SubmitForm() {
  const { t } = useLang();
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [citizenName, setCitizenName] = useState("");
  const [citizenContact, setCitizenContact] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ticketId: string;
    department: string;
    category: string;
    slaDueAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { listening, toggle: toggleVoice, supported: voiceSupported, error: voiceError } = useVoiceToText(setDescription);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Parse JSON from fetch response; handles HTML error pages gracefully */
  const parseJsonResponse = async (res: Response): Promise<Record<string, unknown>> => {
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json") || text.trimStart().startsWith("<")) {
      throw new Error(res.ok ? "Invalid server response" : `Server error (${res.status}). Please try again.`);
    }
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid response. Please try again.");
    }
  };

  /** Resize/compress image to stay under ~500KB to avoid request size limits */
  const compressImage = (dataUrl: string, maxW = 1024, quality = 0.85): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxW || height > maxW) {
          if (width > height) {
            height = Math.round((height * maxW) / width);
            width = maxW;
          } else {
            width = Math.round((width * maxW) / height);
            height = maxW;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = dataUrl;
    });
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        const compressed = await compressImage(dataUrl);
        setPhotoData(compressed);
      } catch {
        setPhotoData(dataUrl);
      }
      fileInputRef.current && (fileInputRef.current.value = "");
    };
    reader.readAsDataURL(file);
  };

  const openCamera = () => {
    fileInputRef.current?.click();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await fetch("/api/grievances/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          location: location || undefined,
          citizenName: citizenName || undefined,
          citizenContact: citizenContact || undefined,
          photoUrl: photoData || undefined,
        }),
      });
      const data = await parseJsonResponse(res) as { error?: string; ticketId?: string; department?: string; category?: string; slaDueAt?: string };
      if (!res.ok) throw new Error(data.error || "Submit failed");
      setResult(data);
      setDescription("");
      setLocation("");
      setCitizenName("");
      setCitizenContact("");
      setPhotoData(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/20" style={{ boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}>
          <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold" style={{ color: "#e8e8e8" }}>{t("submitGrievance")}</h2>
      </div>
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">{t("describeIssue")} *</label>
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            rows={4}
            placeholder={t("describePlaceholder")}
          />
          {/* Voice input: below the text area so it's not mixed in the chat box */}
          {voiceSupported && (
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={toggleVoice}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  listening ? "bg-red-500/30 text-red-300 ring-2 ring-red-400/50" : "bg-slate-500/20 text-slate-300 hover:bg-slate-500/30"
                }`}
                title={listening ? t("stopListening") : t("speakIssue")}
              >
                <span className="text-lg" aria-hidden>{listening ? "⏹" : "🎤"}</span>
                {listening ? t("stopListening") : t("speakIssue")}
              </button>
              {listening && (
                <span className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" />
                  {t("listening")}
                </span>
              )}
              {voiceError && (
                <span className="text-sm text-amber-400">{voiceError} Or type your issue above.</span>
              )}
            </div>
          )}
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">{t("location")}</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            placeholder={t("locationPlaceholder")}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400">{t("yourName")}</label>
            <input
              type="text"
              value={citizenName}
              onChange={(e) => setCitizenName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-400">{t("contact")}</label>
            <input
              type="text"
              value={citizenContact}
              onChange={(e) => setCitizenContact(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
              placeholder={t("contactPlaceholder")}
            />
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">{t("photo")}</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={onFileChange}
            className="hidden"
            aria-hidden
          />
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={openCamera}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-500/20 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-500/30"
            >
              <span aria-hidden>📷</span>
              {t("takePhoto")}
            </button>
            {photoData && (
              <span className="text-xs text-slate-300">{t("imageAttached")}</span>
            )}
          </div>
        </div>
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {result && (
          <div className="rounded-xl border border-slate-400/20 bg-slate-500/10 p-4 text-slate-200" style={{ boxShadow: "0 0 12px rgba(192, 192, 192, 0.25)" }}>
            <p className="font-mono font-semibold">Ticket ID: {result.ticketId}</p>
            <p className="mt-1 text-sm">Department: {result.department} · Category: {result.category}</p>
            <p className="text-sm">Expected by: {new Date(result.slaDueAt).toLocaleString()}</p>
            <p className="mt-2 text-xs text-slate-400">Save your ticket ID to track status.</p>
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl px-4 py-3.5 font-semibold text-black transition hover:opacity-90 disabled:opacity-50"
          style={{ background: "linear-gradient(180deg, #e8e8e8 0%, #c0c0c0 100%)", boxShadow: "0 0 12px rgba(192, 192, 192, 0.3)" }}
        >
          {loading ? "Submitting..." : t("submitButton")}
        </button>
      </form>
    </div>
  );
}

const STATUS_FLOW = ["received", "assigned", "in_progress", "resolved"] as const;
const STATUS_LABELS: Record<string, string> = {
  received: "Received",
  assigned: "Assigned",
  in_progress: "In progress",
  pending_dependency: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

function StatusCheck() {
  const { t } = useLang();
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{
    ticketId: string;
    status: string;
    department: string;
    category: string;
    slaDueAt: string | null;
    minutesRemaining: number | null;
    breached: boolean;
    assignedTo: string | null;
    history: { status: string; note: string | null; createdAt: string }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketId.trim()) return;
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch(
        `/api/grievances/status/${encodeURIComponent(ticketId.trim().toUpperCase())}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Not found");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ticket not found");
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = data
    ? Math.max(
        0,
        STATUS_FLOW.findIndex((s) => s === data.status)
      )
    : -1;

  return (
    <div className="rounded-2xl border border-white/5 bg-[#0a0a0a] p-6 shadow-xl sm:p-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-500/20" style={{ boxShadow: "0 0 10px rgba(192, 192, 192, 0.3)" }}>
          <svg className="h-5 w-5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold" style={{ color: "#e8e8e8" }}>{t("trackGrievance")}</h2>
      </div>
      <form onSubmit={check} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-400">{t("ticketId")}</label>
          <input
            type="text"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-mono text-white placeholder-slate-500 focus:border-slate-400/50 focus:outline-none focus:ring-2 focus:ring-slate-400/30"
            placeholder={t("ticketIdPlaceholder")}
          />
        </div>
        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition hover:bg-white/10 disabled:opacity-50"
        >
          {loading ? "Checking..." : t("checkStatus")}
        </button>
      </form>

      <div className="mt-6">
        <p className="mb-2 text-sm font-bold uppercase tracking-wider" style={{ color: "#c0c0c0", textShadow: "0 0 12px rgba(192, 192, 192, 0.5), 0 0 24px rgba(192, 192, 192, 0.3)" }}>Worker live location</p>
        <WorkerLiveMap />
      </div>

      {data && (
        <div className="mt-8 space-y-6 rounded-xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-lg font-semibold text-cyan-400">{data.ticketId}</span>
            <span
              className={`rounded-lg px-3 py-1 text-sm font-medium ${
                data.breached ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-300"
              }`}
            >
              {STATUS_LABELS[data.status] ?? data.status}
            </span>
          </div>

          {/* Progress stepper */}
          <div className="flex items-center justify-between gap-1">
            {STATUS_FLOW.map((status, i) => {
              const done = i <= currentStepIndex;
              const current = i === currentStepIndex;
              return (
                <div key={status} className="flex flex-1 flex-col items-center">
                  <div
                    className={`h-2 w-full rounded-full ${
                      done ? "bg-slate-400" : "bg-white/10"
                    } ${current ? "ring-2 ring-slate-400 ring-offset-2 ring-offset-black" : ""}`}
                  />
                  <span
                    className={`mt-2 text-xs ${
                      done ? "text-slate-300" : "text-slate-500"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-sm text-slate-400">
            {data.department} · {data.category}
            {data.assignedTo && ` · Assigned to ${data.assignedTo}`}
          </p>
          {data.slaDueAt && (
            <p className="text-sm">
              {data.breached ? (
                <span className="text-amber-400">SLA breached (due {new Date(data.slaDueAt).toLocaleString()})</span>
              ) : data.minutesRemaining != null ? (
                <span className="text-slate-300">
                  Time remaining: ~{Math.floor(data.minutesRemaining / 60)}h {data.minutesRemaining % 60}m
                </span>
              ) : null}
            </p>
          )}
          {/* Worker info — map shown below form */}
          <div className="rounded-xl border border-slate-400/20 bg-slate-500/5 p-4" style={{ boxShadow: "0 0 10px rgba(192, 192, 192, 0.2)" }}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex-shrink-0 rounded-full bg-slate-600 flex items-center justify-center text-lg">👤</div>
              <div>
                <p className="font-medium text-white">{data.assignedTo || "Field worker"}</p>
                <p className="text-xs text-slate-400">On the way to incident spot</p>
              </div>
            </div>
            <p className="mt-2 text-sm text-slate-300" style={{ textShadow: "0 0 8px rgba(192, 192, 192, 0.35)" }}>ETA ~{data.minutesRemaining != null ? Math.max(5, Math.floor(data.minutesRemaining / 6)) : 12} min</p>
          </div>

          <div className="border-t border-white/10 pt-4">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">History</p>
            <ul className="space-y-2 text-sm text-slate-400">
              {(data.history ?? []).map((h, i) => (
                <li key={i} className="flex justify-between gap-2">
                  <span>{STATUS_LABELS[h.status] ?? h.status}{h.note ? ` — ${h.note}` : ""}</span>
                  <span className="text-slate-500">{new Date(h.createdAt).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
