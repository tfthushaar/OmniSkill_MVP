"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, Check, ChevronRight, ClipboardCopy } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { CareerTrack, Passport } from "@/lib/types";

const verificationLevelLabel: Record<number, string> = {
  1: "Self-reported",
  2: "Account-linked",
  3: "Platform verified",
  4: "Community verified",
  5: "Institution verified",
};

const ML = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "2px", textTransform: "uppercase" as const }}>
    {children}
  </span>
);

function CopyBullet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div
      onClick={copy}
      style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 14px", border: "1px solid var(--border)", cursor: "pointer", transition: "all 150ms ease" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <ChevronRight size={13} style={{ marginTop: "3px", flexShrink: 0, color: "var(--accent)" }} />
      <p style={{ flex: 1, fontSize: "15px", color: "var(--text)", lineHeight: 1.6 }}>{text}</p>
      {copied
        ? <Check size={13} style={{ flexShrink: 0, color: "var(--accent3)" }} />
        : <ClipboardCopy size={13} style={{ flexShrink: 0, color: "var(--text-dim)" }} />
      }
    </div>
  );
}

function SignalBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <ML>{label}</ML>
        <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--accent)" }}>{pct}%</span>
      </div>
      <div className="signal-bar"><div className="signal-bar-fill" style={{ width: `${pct}%` }} /></div>
    </div>
  );
}

function CareerTracks({ tracks }: { tracks: CareerTrack[] }) {
  const strong = tracks.filter((t) => t.fit === "strong");
  const moderate = tracks.filter((t) => t.fit === "moderate");
  if (!tracks.length) return null;
  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <p className="eyebrow" style={{ marginBottom: "4px" }}>Career track suggestions</p>
        <ML>Based on verified evidence patterns. Suggestions, not guarantees.</ML>
      </div>
      {strong.length > 0 && (
        <div>
          <ML>Strong fit</ML>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px" }}>
            {strong.map((t) => (
              <div key={t.track} className="track-strong" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--accent)" }}>▶</span>
                <span style={{ fontSize: "13px", color: "var(--text-bright)", fontFamily: "var(--font-body, sans-serif)", fontWeight: 600 }}>{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {moderate.length > 0 && (
        <div>
          <ML>Moderate fit</ML>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginTop: "8px" }}>
            {moderate.map((t) => (
              <div key={t.track} className="track-moderate" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--accent3)" }}>▷</span>
                <span style={{ fontSize: "13px", color: "var(--text)", fontFamily: "var(--font-body, sans-serif)" }}>{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PublicPassportPage() {
  const params = useParams<{ username: string }>();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [error, setError] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try { setPassport(await apiFetch<Passport>(`/passport/public/${params.username}`)); }
      catch (e) { setError(e instanceof Error ? e.message : "Passport not found"); }
    }
    if (params.username) void load();
  }, [params.username]);

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2500); });
  }

  if (error) {
    return (
      <main className="app-bg" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", padding: "40px" }}>
        <div className="panel panel-accent" style={{ maxWidth: "440px", textAlign: "center", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center" }}>
          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--accent2)", letterSpacing: "3px", textTransform: "uppercase" }}>// Passport not found</p>
          <h1 className="section-title">Passport unavailable</h1>
          <p style={{ color: "var(--text-dim)", fontSize: "15px" }}>{error}</p>
          <Link href="/" className="btn-secondary"><ArrowLeft size={13} /> Omni-Skill</Link>
        </div>
      </main>
    );
  }

  if (!passport) {
    return (
      <main className="app-bg" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "13px", color: "var(--accent)", letterSpacing: "3px", textTransform: "uppercase" }}>// Loading passport...</p>
      </main>
    );
  }

  const displayName = passport.profile.name || passport.profile.username;
  const hasTracks = passport.career_tracks && passport.career_tracks.length > 0;

  return (
    <main className="app-bg min-h-screen">

      {/* ─── NAV ─── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(5,10,15,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: "56px" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none", opacity: 0.8 }}>
          <ArrowLeft size={14} style={{ color: "var(--text-dim)" }} />
          <span className="logo-text" style={{ fontSize: "15px" }}>OMNI<span className="logo-dash">-</span>SKILL</span>
        </Link>
        <button type="button" onClick={copyLink} className="btn-secondary" style={{ fontSize: "11px" }}>
          {linkCopied ? <><Check size={13} style={{ color: "var(--accent3)" }} /> Copied!</> : <><ClipboardCopy size={13} /> Share passport</>}
        </button>
      </nav>

      {/* ─── PROFILE HEADER ─── */}
      <section style={{ borderBottom: "1px solid var(--border)", background: "rgba(8,15,24,0.7)", padding: "60px 40px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 280px", gap: "40px", alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <span className="chip">Verified career evidence</span>
            <h1 style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "clamp(48px, 6vw, 80px)", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", letterSpacing: "-1px", color: "var(--text-bright)", lineHeight: 0.9 }}>
              {displayName}
            </h1>
            <p style={{ fontFamily: "var(--font-body, Rajdhani, sans-serif)", fontSize: "20px", color: "var(--text-dim)", letterSpacing: "1px" }}>
              {passport.profile.headline || passport.profile.role_identity}
            </p>
            {passport.profile.college && (
              <ML>
                {passport.profile.college}{passport.profile.graduation_year ? ` · Class of ${passport.profile.graduation_year}` : ""}
              </ML>
            )}
            {passport.career_summary && (
              <p style={{ fontSize: "16px", color: "var(--text)", lineHeight: 1.7, maxWidth: "640px", borderLeft: "2px solid var(--accent)", paddingLeft: "16px", marginTop: "4px" }}>
                {passport.career_summary}
              </p>
            )}
          </div>

          {/* Verification card */}
          <div className="panel panel-accent" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", marginBottom: "4px" }} />
            <p className="eyebrow">Verification breakdown</p>
            {Object.entries(passport.verification_breakdown).length ? (
              <>
                {Object.entries(passport.verification_breakdown).map(([label, count]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <ML>{label.replace(/_/g, " ")}</ML>
                    <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "14px", color: "var(--accent)", fontWeight: 700 }}>{count}</span>
                  </div>
                ))}
                <div className="divider" />
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <ML>Total verified</ML>
                  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "18px", color: "var(--accent3)", fontWeight: 700 }}>
                    {Object.values(passport.verification_breakdown).reduce((a, b) => a + b, 0)}
                  </span>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                  <span className="tag tag-cyan">Consistency</span>
                  <span className="tag tag-green">Community Ops</span>
                  <span className="tag tag-orange">Competitive</span>
                </div>
              </>
            ) : (
              <ML>No approved evidence yet.</ML>
            )}
          </div>
        </div>
      </section>

      <div className="glow-line" />

      {/* ─── MAIN CONTENT ─── */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 40px 80px", display: "flex", flexDirection: "column", gap: "24px" }}>

        {/* Signals */}
        {passport.skill_cards.length > 0 && (
          <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <p className="eyebrow">04 // Signal strength</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {passport.skill_cards.map((c) => <SignalBar key={c.id} label={c.signal_name} value={c.confidence} />)}
            </div>
          </div>
        )}

        {/* Career tracks */}
        {hasTracks && <CareerTracks tracks={passport.career_tracks} />}

        {/* Evidence cards */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p className="eyebrow">05 // Evidence cards</p>
          {passport.skill_cards.length ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: "var(--border)" }}>
              {passport.skill_cards.map((c) => (
                <div key={c.id} className="panel" style={{ position: "relative", overflow: "hidden" }}>
                  <div style={{ height: "2px", background: "linear-gradient(90deg, var(--accent), var(--accent3))", marginBottom: "12px" }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "10px" }}>
                    <p style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "18px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.5px", color: "var(--text-bright)" }}>{c.signal_name}</p>
                    <span className="chip">{verificationLevelLabel[c.verification_level] || `Lv ${c.verification_level}`}</span>
                  </div>
                  <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>{c.career_translation}</p>
                  {c.limitations && (
                    <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--accent2)", marginTop: "10px", letterSpacing: "0.5px" }}>⚠ {c.limitations}</p>
                  )}
                  {c.supporting_facts.length > 0 && (
                    <div style={{ marginTop: "12px", borderTop: "1px solid var(--border)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                      {c.supporting_facts.map((f, i) => (
                        <p key={i} style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ color: "var(--accent)", display: "inline-block", width: "4px", height: "4px", background: "var(--accent)", borderRadius: "50%", flexShrink: 0 }} />
                          {f}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ML>No approved evidence cards yet.</ML>
          )}
        </div>

        {/* Resume bullets */}
        <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p className="eyebrow">06 // Resume bullets</p>
            <ML>Click to copy</ML>
          </div>
          {passport.resume_bullets.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)" }}>
              {passport.resume_bullets.map((b) => <CopyBullet key={b.id} text={b.bullet} />)}
            </div>
          ) : (
            <ML>// Resume bullets appear after evidence is approved.</ML>
          )}
        </div>

        {/* Footer CTA */}
        <div className="panel panel-accent" style={{ textAlign: "center", padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
          <div style={{ height: "2px", background: "linear-gradient(90deg, transparent, var(--accent), transparent)", width: "100%", marginBottom: "8px" }} />
          <p className="eyebrow">Build your own</p>
          <h3 style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "32px", fontWeight: 900, fontStyle: "italic", textTransform: "uppercase", color: "var(--text-bright)" }}>
            Get your Omni-Skill Passport
          </h3>
          <p style={{ color: "var(--text-dim)", fontSize: "16px", maxWidth: "480px" }}>
            Turn your gaming, esports, and community experience into verified career evidence.
          </p>
          <Link href="/" className="btn-primary">Start your passport →</Link>
        </div>
      </section>
    </main>
  );
}
