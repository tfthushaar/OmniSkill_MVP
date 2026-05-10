"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  FileText,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

const signalPreview = [
  { month: "Jan", consistency: 2, operations: 1 },
  { month: "Feb", consistency: 4, operations: 2 },
  { month: "Mar", consistency: 5, operations: 3 },
  { month: "Apr", consistency: 7, operations: 5 },
  { month: "May", consistency: 9, operations: 6 },
];

const features = [
  {
    icon: BadgeCheck,
    color: "text-cyan-400",
    bg: "bg-cyan-400",
    title: "5 Verification Levels",
    desc: "Self-reported up to institution-verified. Every claim shows its evidence source and confidence.",
  },
  {
    icon: FileText,
    color: "text-purple-400",
    bg: "bg-purple-400",
    title: "Passport Outputs",
    desc: "Evidence cards, public profile, copy-ready resume bullets, and PDF export for applications.",
  },
  {
    icon: Sparkles,
    color: "text-green-400",
    bg: "bg-green-400",
    title: "Honest AI Layer",
    desc: "AI polishes wording from verified facts only. Unsupported claims stay out.",
  },
];

const evidenceTypes = [
  { icon: Users, label: "Discord Admin", desc: "Community ops & moderation" },
  { icon: Trophy, label: "Esports Player", desc: "Competitive participation" },
  { icon: Zap, label: "Tournament Organizer", desc: "Event planning & delivery" },
  { icon: Gamepad2, label: "Club Member", desc: "Campus esports societies" },
  { icon: ShieldCheck, label: "Guild Leader", desc: "Digital team coordination" },
];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [message, setMessage] = useState("");
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    setChartsReady(true);
    const saved = window.localStorage.getItem("omniskill_token");
    if (saved) router.push("/dashboard");
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await apiFetch<AuthResponse>(
        mode === "register" ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body:
            mode === "register"
              ? { email, password, admin_invite_code: adminCode }
              : { email, password },
        },
      );
      window.localStorage.setItem("omniskill_token", response.access_token);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not continue");
    }
  }

  return (
    <main className="app-bg min-h-screen">
      {/* Nav */}
      <nav className="border-b border-[rgba(255,255,255,0.06)] bg-[rgba(8,11,20,0.8)] backdrop-blur-sm sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-8">
          <div className="flex items-center gap-2">
            <Gamepad2 size={20} className="text-[var(--cyan)]" />
            <span className="text-sm font-black tracking-tight logo-glow">OMNI-SKILL</span>
          </div>
          <span className="text-xs font-semibold text-[var(--text-muted)] border border-[var(--border)] rounded-full px-3 py-1">
            Early Access
          </span>
        </div>
      </nav>

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-8 lg:py-16">
        {/* Left: Hero */}
        <div className="space-y-8">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--border-cyan)] bg-[var(--cyan-dim)] px-3 py-1.5 text-xs font-bold text-[var(--cyan)] uppercase tracking-widest">
              <Zap size={12} /> Career evidence platform
            </div>
            <h1 className="text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Your gaming history{" "}
              <span className="gradient-text">is career proof.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">
              Omni-Skill turns Discord moderation, esports competition, tournament organization, and guild leadership into verified evidence cards, resume bullets, and a shareable professional passport.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="panel panel-glow space-y-2">
                <div className={`inline-flex rounded-lg p-2 bg-opacity-10 ${f.color} bg-current`}>
                  <f.icon size={18} className={f.color} />
                </div>
                <p className="text-sm font-bold text-white">{f.title}</p>
                <p className="text-xs text-[var(--text-secondary)] leading-5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Evidence types */}
          <div className="panel space-y-4">
            <div>
              <p className="eyebrow">Supported evidence types</p>
              <h2 className="section-title mt-1">What you can prove</h2>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {evidenceTypes.map((t) => (
                <div
                  key={t.label}
                  className="flex flex-col items-center gap-2 rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3 text-center"
                >
                  <t.icon size={20} className="text-[var(--cyan)]" />
                  <span className="text-xs font-bold text-white leading-tight">{t.label}</span>
                  <span className="text-[10px] text-[var(--text-muted)] leading-tight">{t.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Signal preview chart */}
          <div className="panel space-y-3">
            <div>
              <p className="eyebrow">Sample signal growth</p>
              <h2 className="section-title mt-1">Signals grow only when evidence supports them</h2>
            </div>
            <div className="h-48">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                  <AreaChart data={signalPreview}>
                    <defs>
                      <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00d4ff" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="gPurple" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#475569" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0d1225",
                        border: "1px solid rgba(0,212,255,0.28)",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="consistency"
                      stroke="#00d4ff"
                      strokeWidth={2}
                      fill="url(#gCyan)"
                    />
                    <Area
                      type="monotone"
                      dataKey="operations"
                      stroke="#7c3aed"
                      strokeWidth={2}
                      fill="url(#gPurple)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
            <div className="flex gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-[var(--cyan)] rounded" /> Consistency</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-purple-500 rounded" /> Operations</span>
            </div>
          </div>
        </div>

        {/* Right: Auth form */}
        <div className="panel panel-glow mx-auto w-full max-w-md">
          <div className="flex rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.03)] p-1 mb-6">
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
                mode === "register"
                  ? "bg-[var(--cyan-dim)] border border-[var(--border-cyan)] text-[var(--cyan)]"
                  : "text-[var(--text-muted)]"
              }`}
              type="button"
              onClick={() => setMode("register")}
            >
              Create account
            </button>
            <button
              className={`flex-1 rounded-md px-3 py-2 text-sm font-bold transition-all ${
                mode === "login"
                  ? "bg-[var(--cyan-dim)] border border-[var(--border-cyan)] text-[var(--cyan)]"
                  : "text-[var(--text-muted)]"
              }`}
              type="button"
              onClick={() => setMode("login")}
            >
              Sign in
            </button>
          </div>

          <form className="space-y-4" onSubmit={submit}>
            <div>
              <p className="eyebrow">{mode === "register" ? "Start your passport" : "Continue"}</p>
              <h2 className="section-title mt-1">
                {mode === "register" ? "Create your account" : "Open your workspace"}
              </h2>
            </div>
            <label className="label">
              Email address
              <input
                className="input"
                inputMode="email"
                placeholder="you@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="label">
              Password
              <input
                className="input"
                type="password"
                minLength={8}
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {mode === "register" ? (
              <label className="label">
                Admin code
                <input
                  className="input"
                  placeholder="Leave blank for standard account"
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value)}
                />
              </label>
            ) : null}
            {message ? <div className="notice notice-error">{message}</div> : null}
            <button className="btn-primary w-full" type="submit">
              {mode === "register" ? "Build my passport" : "Sign in"}
              <ArrowRight size={16} />
            </button>
            <p className="text-center text-xs text-[var(--text-muted)]">
              No recruiter marketplace. Evidence-first. Privacy-respecting.
            </p>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-[var(--border)] mt-12">
        <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Gamepad2 size={16} className="text-[var(--cyan)]" />
            <span className="text-xs font-black logo-glow">OMNI-SKILL</span>
            <span className="text-xs text-[var(--text-muted)]">Career Graph · Early Access</span>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Verified digital activity → Professional proof. No fake science.
          </p>
        </div>
      </footer>
    </main>
  );
}
