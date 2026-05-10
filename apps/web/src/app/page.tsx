"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

const features = [
  {
    tag: "tag-cyan",
    label: "Evidence Cards",
    desc: "Verified claims with source, confidence level, and career translation. Every card shows its proof and limitations.",
  },
  {
    tag: "tag-green",
    label: "Resume Bullets",
    desc: "Professional copy-ready bullets generated strictly from approved evidence. No invented traits.",
  },
  {
    tag: "tag-orange",
    label: "Career Track Mapping",
    desc: "Role suggestions based on your evidence patterns — Community Manager, Esports Analyst, Event Producer.",
  },
  {
    tag: "tag-red",
    label: "Shareable Passport",
    desc: "Public profile with verification breakdown, signal strength, and PDF export for internship applications.",
  },
];

const evidenceTypes = [
  { icon: "💬", label: "Discord Admin", sub: "Community ops & moderation" },
  { icon: "🎮", label: "Esports Player", sub: "Competitive participation" },
  { icon: "🏆", label: "Tournament Organizer", sub: "Event planning & delivery" },
  { icon: "🎓", label: "Club Member", sub: "Campus esports societies" },
  { icon: "⚔️", label: "Guild Leader", sub: "Digital team coordination" },
];

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "login">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
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
      <nav style={{ position: "sticky", top: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: "60px", background: "rgba(5,10,15,0.95)", borderBottom: "1px solid #1a2d42", backdropFilter: "blur(12px)" }}>
        <div className="logo-text" style={{ fontSize: "20px" }}>
          OMNI<span className="logo-dash">-</span>SKILL
        </div>
        <div style={{ display: "flex", gap: "4px" }}>
          {["Evidence", "Signals", "Trust", "Careers"].map((label) => (
            <span key={label} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--text-dim)", padding: "6px 14px", letterSpacing: "2px", textTransform: "uppercase", cursor: "default" }}>
              {label}
            </span>
          ))}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section
        style={{ minHeight: "100vh", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: "center", padding: "80px 40px 60px", position: "relative", overflow: "hidden", background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,229,255,0.05) 0%, transparent 65%), radial-gradient(ellipse 50% 40% at 80% 20%, rgba(255,60,95,0.04) 0%, transparent 55%), var(--bg)" }}
      >
        <div className="grid-overlay" />
        <div style={{ position: "absolute", width: "600px", height: "600px", background: "radial-gradient(ellipse, rgba(0,229,255,0.06) 0%, transparent 70%)", top: "50%", left: "50%", transform: "translate(-50%,-50%)", borderRadius: "50%", animation: "orb-pulse 4s ease-in-out infinite", pointerEvents: "none" }} />

        <p className="eyebrow" style={{ marginBottom: "20px", animation: "fade-up 0.6s 0.2s both" }}>
          Career Evidence Platform
        </p>

        <h1 className="hero-title" style={{ fontSize: "clamp(72px, 12vw, 140px)", animation: "fade-up 0.7s 0.3s both" }}>
          <span style={{ display: "block" }}>OMNI</span>
          <span className="text-outline" style={{ display: "block" }}>SKILL</span>
        </h1>

        <p style={{ fontFamily: "var(--font-body, Rajdhani, sans-serif)", fontSize: "19px", fontWeight: 500, color: "var(--text-dim)", maxWidth: "680px", marginTop: "28px", letterSpacing: "1px", lineHeight: 1.7, animation: "fade-up 0.7s 0.5s both" }}>
          Turn your gaming, esports, and community history into{" "}
          <span style={{ color: "var(--accent)" }}>verified career proof.</span>{" "}
          Evidence cards, resume bullets, career tracks, and a shareable professional passport.
        </p>

        <div style={{ position: "absolute", bottom: "30px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "2px" }}>
          SCROLL
          <span style={{ width: "1px", height: "40px", background: "linear-gradient(to bottom, var(--accent), transparent)", display: "block" }} />
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── TWO COLUMN: features + auth ─── */}
      <section style={{ padding: "80px 40px" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "start" }}>

          {/* Left: features */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            <div>
              <p className="eyebrow" style={{ marginBottom: "10px" }}>// What you get</p>
              <h2 className="section-title">Verified career evidence,<br />not empty claims.</h2>
              <p style={{ color: "var(--text-dim)", fontSize: "16px", marginTop: "14px", lineHeight: 1.7 }}>
                Recruiters distrust vague statements. Omni-Skill attaches verification levels, source data, and honest limitations to every claim.
              </p>
            </div>

            {/* Feature cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)" }}>
              {features.map((f) => (
                <div key={f.label} className="panel" style={{ display: "flex", gap: "16px", alignItems: "flex-start", transition: "background 0.2s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                  <span className={`tag ${f.tag}`} style={{ marginTop: "2px", flexShrink: 0 }}>{f.label}</span>
                  <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              ))}
            </div>

            {/* Evidence types */}
            <div>
              <p className="eyebrow" style={{ marginBottom: "12px" }}>// Supported evidence types</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "2px", background: "var(--border)" }}>
                {evidenceTypes.map((t) => (
                  <div key={t.label} className="panel" style={{ textAlign: "center", padding: "16px 8px", display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "22px" }}>{t.icon}</span>
                    <span style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "13px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-bright)", lineHeight: 1.1 }}>{t.label}</span>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.5px", lineHeight: 1.4 }}>{t.sub}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification levels mini */}
            <div className="panel panel-red" style={{ padding: "20px 24px" }}>
              <p className="eyebrow" style={{ marginBottom: "10px" }}>// 5-level verification</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {[
                  ["Lv 1", "Self-reported", "text-dim"],
                  ["Lv 2", "Account-linked", "text-dim"],
                  ["Lv 3", "Platform data verified", "text"],
                  ["Lv 4", "Peer / community verified", "text"],
                  ["Lv 5", "Institution verified", "accent3"],
                ].map(([lv, label, col]) => (
                  <div key={lv} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--accent)", letterSpacing: "1px", width: "32px", flexShrink: 0 }}>{lv}</span>
                    <span style={{ fontSize: "14px", color: col === "accent3" ? "var(--accent3)" : col === "text" ? "var(--text)" : "var(--text-dim)" }}>{label}</span>
                    {col === "accent3" && <span className="chip chip-green" style={{ marginLeft: "auto" }}>Highest</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: auth form */}
          <div className="panel panel-accent" style={{ position: "sticky", top: "80px" }}>
            <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", marginBottom: "24px" }} />

            <div style={{ display: "flex", gap: "2px", background: "var(--border)", padding: "2px", marginBottom: "24px" }}>
              {(["register", "login"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} style={{ flex: 1, padding: "10px", fontFamily: "var(--font-mono, monospace)", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", cursor: "pointer", background: mode === m ? "var(--accent)" : "transparent", color: mode === m ? "var(--bg)" : "var(--text-dim)", border: "none", transition: "all 150ms ease" }}>
                  {m === "register" ? "Create Account" : "Sign In"}
                </button>
              ))}
            </div>

            <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "6px" }}>
                  {mode === "register" ? "// Start passport" : "// Continue"}
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
                  Invite code
                  <input className="input" placeholder="Required for admin access" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} />
                </label>
              )}

              {message && <div className="notice notice-error">{message}</div>}

              <button className="btn-primary" type="submit" style={{ width: "100%" }}>
                {mode === "register" ? "Build my passport" : "Sign in"}
                <ArrowRight size={15} />
              </button>

              <p style={{ textAlign: "center", fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", lineHeight: 1.8 }}>
                Evidence-first · No black-box scores · Privacy-respecting
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: "var(--bg)", borderTop: "1px solid var(--border)", padding: "24px 40px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div className="logo-text" style={{ fontSize: "14px", opacity: 0.6 }}>
          OMNI<span className="logo-dash">-</span>SKILL // Career Graph
        </div>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px" }}>
          Verified digital activity → Professional proof. No fake science.
        </span>
      </footer>
    </main>
  );
}
