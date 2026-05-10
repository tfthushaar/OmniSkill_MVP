"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

const signalPreview = [
  { name: "Jan", consistency: 2, operations: 1 },
  { name: "Feb", consistency: 4, operations: 2 },
  { name: "Mar", consistency: 5, operations: 3 },
  { name: "Apr", consistency: 7, operations: 4 },
  { name: "May", consistency: 9, operations: 6 },
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
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    try {
      const response = await apiFetch<AuthResponse>(mode === "register" ? "/auth/register" : "/auth/login", {
        method: "POST",
        body:
          mode === "register"
            ? { email, password, admin_invite_code: adminCode }
            : { email, password },
      });
      window.localStorage.setItem("omniskill_token", response.access_token);
      router.push("/dashboard");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not continue");
    }
  }

  return (
    <main className="app-bg min-h-screen">
      <section className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm font-semibold text-teal-800">
            <ShieldCheck size={16} /> Evidence-first career passports
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
              Turn gaming and community history into verified career proof.
            </h1>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
              Omni-Skill converts Discord, esports, tournament, club, and guild activity into evidence cards, resume bullets, and a shareable passport without pretending that raw playtime proves job readiness.
            </p>
          </div>

          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <div className="panel">
              <BadgeCheck className="text-teal-700" size={20} />
              <p className="mt-3 text-sm font-semibold text-slate-950">Verification levels</p>
              <p className="mt-1 text-sm text-slate-600">Self, account, platform, community, and institution-backed claims.</p>
            </div>
            <div className="panel">
              <FileText className="text-amber-700" size={20} />
              <p className="mt-3 text-sm font-semibold text-slate-950">Passport outputs</p>
              <p className="mt-1 text-sm text-slate-600">Evidence cards, public profile, copy-ready bullets, and PDF export.</p>
            </div>
            <div className="panel">
              <Sparkles className="text-rose-700" size={20} />
              <p className="mt-3 text-sm font-semibold text-slate-950">Careful AI lane</p>
              <p className="mt-1 text-sm text-slate-600">Wording can improve, but unsupported claims stay out.</p>
            </div>
          </div>

          <div className="panel max-w-3xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Sample signal view</p>
                <h2 className="section-title">Signals grow only when evidence supports them</h2>
              </div>
            </div>
            <div className="mt-4 h-56">
              {chartsReady ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                  <AreaChart data={signalPreview}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="consistency" stroke="#0f766e" fill="#99f6e4" />
                    <Area type="monotone" dataKey="operations" stroke="#c2410c" fill="#fed7aa" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </div>
          </div>
        </div>

        <div className="panel mx-auto w-full max-w-md">
          <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mode === "register" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} type="button" onClick={() => setMode("register")}>
              Create
            </button>
            <button className={`flex-1 rounded-md px-3 py-2 text-sm font-bold ${mode === "login" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`} type="button" onClick={() => setMode("login")}>
              Sign in
            </button>
          </div>

          <form className="mt-5 space-y-4" onSubmit={submit}>
            <div>
              <p className="eyebrow">{mode === "register" ? "Start passport" : "Continue"}</p>
              <h2 className="section-title">{mode === "register" ? "Create your MVP account" : "Open your workspace"}</h2>
            </div>
            <label className="label">
              Email
              <input className="input" inputMode="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="label">
              Password
              <input className="input" type="password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required />
            </label>
            {mode === "register" ? (
              <label className="label">
                Admin code
                <input className="input" value={adminCode} onChange={(event) => setAdminCode(event.target.value)} />
              </label>
            ) : null}
            {message ? <div className="notice">{message}</div> : null}
            <button className="btn-primary w-full" type="submit">
              {mode === "register" ? "Create account" : "Sign in"} <ArrowRight size={16} />
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
