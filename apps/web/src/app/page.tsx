"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

const signalData = [
  { month: "Jan", consistency: 2, operations: 1 },
  { month: "Feb", consistency: 4, operations: 2 },
  { month: "Mar", consistency: 5, operations: 3 },
  { month: "Apr", consistency: 7, operations: 5 },
  { month: "May", consistency: 9, operations: 6 },
];

const layers = [
  {
    name: "Platform Data Pipeline",
    desc: "Pulls data from supported game/esports/community platforms",
    example: "FACEIT match history, Steam achievements, Riot match/ranked data, Discord guild evidence",
  },
  {
    name: "Community Evidence Pipeline",
    desc: "Captures online community and event operations evidence",
    example: "Discord moderator role, club leadership, event organization, tournament participation",
  },
  {
    name: "Skill Signal Engine",
    desc: "Calculates observable signals from normalized data",
    example: "Consistency, improvement, role stability, competitive engagement, community ops",
  },
  {
    name: "Verification Layer",
    desc: "Assigns trust level and keeps audit history",
    example: "Level 3 platform-verified; Level 5 institution-verified",
  },
  {
    name: "Passport Generator",
    desc: "Creates the final shareable career artifact",
    example: "Public profile, evidence cards, resume bullets, PDF export",
  },
];

const badges = ["Career Evidence Platform", "Esports · Discord · FACEIT", "India-First Launch", "MVP 2026"];

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

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    try {
      const res = await apiFetch<AuthResponse>(
        mode === "register" ? "/auth/register" : "/auth/login",
        {
          method: "POST",
          body: mode === "register"
            ? { email, password, admin_invite_code: adminCode }
            : { email, password },
        },
      );
      window.localStorage.setItem("omniskill_token", res.access_token);
      router.push("/dashboard");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not continue");
    }
  }

  return (
    <main className="app-bg min-h-screen">

      {/* ─── NAV ─── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 40px",
          height: "60px",
          background: "rgba(5,10,15,0.92)",
          borderBottom: "1px solid #1a2d42",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="logo-text" style={{ fontSize: "20px" }}>
          OMNI<span className="logo-dash">-</span>SKILL
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["Problem", "Signals", "Trust", "Stack"].map((label) => (
            <span
              key={label}
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "11px",
                color: "var(--text-dim)",
                padding: "6px 14px",
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "default",
              }}
            >
              {label}
            </span>
          ))}
        </div>
        <span className="chip">Early Access</span>
      </nav>

      {/* ─── HERO ─── */}
      <section
        className="hero-bg"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
          padding: "80px 40px 60px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="grid-overlay" />

        {/* Orb */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            background: "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            borderRadius: "50%",
            animation: "orb-pulse 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Tag */}
        <p
          className="eyebrow"
          style={{
            marginBottom: "20px",
            animation: "fade-up 0.6s 0.2s both",
          }}
        >
          Career Evidence Platform · 09 May 2026
        </p>

        {/* Big title */}
        <h1
          className="hero-title"
          style={{
            fontSize: "clamp(72px, 12vw, 140px)",
            animation: "fade-up 0.7s 0.3s both",
          }}
        >
          <span style={{ display: "block" }}>OMNI</span>
          <span className="text-outline" style={{ display: "block" }}>SKILL</span>
        </h1>

        <p
          style={{
            fontFamily: "var(--font-body, Rajdhani, sans-serif)",
            fontSize: "18px",
            fontWeight: 500,
            color: "var(--text-dim)",
            maxWidth: "680px",
            marginTop: "28px",
            letterSpacing: "1px",
            lineHeight: 1.7,
            animation: "fade-up 0.7s 0.5s both",
          }}
        >
          A{" "}
          <span style={{ color: "var(--accent)" }}>data-backed career evidence platform</span>{" "}
          that connects to gaming, esports, and digital community platforms — analyzes verified digital activity — and converts it into{" "}
          <span style={{ color: "var(--accent)" }}>explainable career-ready proof</span>.
        </p>

        {/* Badges */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
            justifyContent: "center",
            marginTop: "36px",
            animation: "fade-up 0.7s 0.7s both",
          }}
        >
          {badges.map((b) => (
            <span
              key={b}
              style={{
                fontFamily: "var(--font-mono, monospace)",
                fontSize: "10px",
                letterSpacing: "2px",
                color: "var(--accent3)",
                border: "1px solid rgba(127,255,0,0.3)",
                padding: "6px 16px",
                textTransform: "uppercase",
                background: "rgba(127,255,0,0.04)",
                clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
              }}
            >
              {b}
            </span>
          ))}
        </div>

        {/* Scroll hint */}
        <div
          style={{
            position: "absolute",
            bottom: "30px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "8px",
            fontFamily: "var(--font-mono, monospace)",
            fontSize: "10px",
            color: "var(--text-dim)",
            letterSpacing: "2px",
          }}
        >
          SCROLL
          <span style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, var(--accent), transparent)", display: "block" }} />
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── TWO-COLUMN: signal chart + auth form ─── */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", alignItems: "start" }}>

          {/* Left: Signal chart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "8px" }}>01 // Sample signal growth</p>
              <h2 className="section-title">Signals grow only when<br />evidence supports them</h2>
            </div>
            <div className="panel" style={{ height: "240px" }}>
              {chartsReady && (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                  <AreaChart data={signalData}>
                    <defs>
                      <linearGradient id="gCyan" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00e5ff" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#00e5ff" stopOpacity={0.01} />
                      </linearGradient>
                      <linearGradient id="gGreen" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7fff00" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#7fff00" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#4a6a80", fontFamily: "var(--font-mono, monospace)" }} axisLine={{ stroke: "#1a2d42" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#4a6a80", fontFamily: "var(--font-mono, monospace)" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0b1622", border: "1px solid #00e5ff", borderRadius: 0, color: "#e8f4ff", fontSize: "12px", fontFamily: "var(--font-mono, monospace)" }} />
                    <Area type="monotone" dataKey="consistency" stroke="#00e5ff" strokeWidth={2} fill="url(#gCyan)" />
                    <Area type="monotone" dataKey="operations" stroke="#7fff00" strokeWidth={2} fill="url(#gGreen)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <span className="tag tag-cyan">Consistency</span>
              <span className="tag tag-green">Community Ops</span>
            </div>

            {/* Product layers compact table */}
            <div>
              <p className="eyebrow" style={{ marginBottom: "12px" }}>02 // What the platform does</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)" }}>
                {layers.map((l) => (
                  <div key={l.name} className="panel" style={{ padding: "16px 20px", display: "flex", gap: "16px" }}>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--accent3)", whiteSpace: "nowrap", letterSpacing: "1px", minWidth: "180px", flexShrink: 0 }}>
                      {l.name}
                    </span>
                    <span style={{ fontSize: "14px", color: "var(--text-dim)" }}>{l.example}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Auth form */}
          <div className="panel panel-accent" style={{ position: "sticky", top: "80px" }}>
            {/* Top bar with accent line */}
            <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", marginBottom: "24px" }} />

            {/* Mode toggle */}
            <div style={{ display: "flex", gap: "2px", background: "var(--border)", padding: "2px", marginBottom: "24px" }}>
              {(["register", "login"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  style={{
                    flex: 1,
                    padding: "10px",
                    fontFamily: "var(--font-mono, monospace)",
                    fontSize: "11px",
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    background: mode === m ? "var(--accent)" : "transparent",
                    color: mode === m ? "var(--bg)" : "var(--text-dim)",
                    border: "none",
                    transition: "all 150ms ease",
                  }}
                >
                  {m === "register" ? "Create Account" : "Sign In"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "6px" }}>
                  {mode === "register" ? "Start passport" : "Continue"}
                </p>
                <h2 className="section-title" style={{ fontSize: "1.4rem" }}>
                  {mode === "register" ? "Create your account" : "Open workspace"}
                </h2>
              </div>

              <label className="label">
                Email address
                <input className="input" inputMode="email" placeholder="you@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </label>

              <label className="label">
                Password
                <input className="input" type="password" minLength={8} placeholder="8+ characters" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>

              {mode === "register" && (
                <label className="label">
                  Admin code
                  <input className="input" placeholder="Leave blank for standard account" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} />
                </label>
              )}

              {message && <div className="notice notice-error">{message}</div>}

              <button className="btn-primary" type="submit" style={{ width: "100%", gap: "8px" }}>
                {mode === "register" ? "Build my passport" : "Sign in"}
                <ArrowRight size={15} />
              </button>

              <p style={{ textAlign: "center", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
                No recruiter marketplace · Evidence-first · Privacy-respecting
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "28px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="logo-text" style={{ fontSize: "14px", opacity: 0.6 }}>
          OMNI<span className="logo-dash">-</span>SKILL // Career Graph
        </div>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "2px", textTransform: "uppercase" }}>
          Document Date: 09 May 2026 · India-First Launch · MVP Architecture
        </span>
      </footer>
    </main>
  );
}
