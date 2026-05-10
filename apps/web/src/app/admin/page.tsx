"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CircleSlash, MessageSquareMore, ShieldCheck } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { EvidenceClaim } from "@/lib/types";

const evidenceIcons: Record<string, string> = {
  discord_admin: "💬", esports_player: "🎮", tournament_organizer: "🏆",
  club_member: "🎓", guild_leader: "⚔️",
};

const ML = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "2px", textTransform: "uppercase" as const }}>
    {children}
  </span>
);

type ReviewState = Record<number, { verification_level: number; notes: string }>;

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [msg, setMsg] = useState({ text: "", kind: "notice" as "notice" | "notice-success" | "notice-error" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const pending = await apiFetch<EvidenceClaim[]>("/admin/evidence/pending", { token });
      setClaims(pending);
      setReviewState(Object.fromEntries(pending.map((c) => [c.id, { verification_level: Math.max(3, c.verification_level || 3), notes: c.reviewer_notes || "" }])));
    } catch (e) {
      setMsg({ text: e instanceof Error ? e.message : "Could not load admin queue", kind: "notice-error" });
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    const saved = window.localStorage.getItem("omniskill_token");
    if (!saved) { router.push("/"); return; }
    setToken(saved);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function review(e: FormEvent<HTMLFormElement> | React.MouseEvent, claimId: number, action: "approve" | "reject" | "request-info") {
    e.preventDefault();
    if (!token) return;
    const payload = reviewState[claimId] || { verification_level: 3, notes: "" };
    try {
      await apiFetch(`/admin/evidence/${claimId}/${action}`, { method: "POST", token, body: payload });
      setMsg({ text: `Evidence ${action.replace("-", " ")} complete.`, kind: "notice-success" });
      await load();
    } catch (err) { setMsg({ text: err instanceof Error ? err.message : "Could not update evidence", kind: "notice-error" }); }
  }

  return (
    <main className="app-bg min-h-screen">
      {/* Header */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(5,10,15,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: "56px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span className="logo-text" style={{ fontSize: "16px" }}>OMNI<span className="logo-dash">-</span>SKILL</span>
          <span style={{ color: "var(--border)" }}>|</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <ShieldCheck size={14} style={{ color: "var(--accent)" }} />
            <ML>Verification Layer · Admin Queue</ML>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {claims.length > 0 && <span className="chip chip-orange">{claims.length} pending</span>}
          <Link href="/dashboard" className="btn-secondary" style={{ fontSize: "11px" }}>
            <ArrowLeft size={13} /> Dashboard
          </Link>
        </div>
      </header>

      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 40px", display: "flex", flexDirection: "column", gap: "16px" }}>
        {msg.text && <div className={msg.kind}>{msg.text}</div>}

        {loading && (
          <div className="panel">
            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", color: "var(--accent)", letterSpacing: "2px" }}>// Loading review queue...</p>
          </div>
        )}

        {!loading && !claims.length && (
          <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", padding: "64px 32px", textAlign: "center" }}>
            <ShieldCheck size={36} style={{ color: "var(--accent3)" }} />
            <div>
              <p style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "22px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "2px", color: "var(--text-bright)" }}>Queue is clear</p>
              <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>// No submitted claims awaiting review.</p>
            </div>
          </div>
        )}

        {claims.map((claim) => {
          const state = reviewState[claim.id] || { verification_level: 3, notes: "" };
          return (
            <form key={claim.id} onSubmit={(e) => review(e, claim.id, "approve")} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Top accent line */}
                <div style={{ height: "2px", background: "linear-gradient(90deg, var(--accent2), transparent)", marginBottom: "4px" }} />

                {/* Header row */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <span style={{ fontSize: "24px", lineHeight: 1, marginTop: "2px" }}>{evidenceIcons[claim.kind] || "📋"}</span>
                      <div>
                        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                          <h2 style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "22px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-bright)" }}>
                            {claim.title}
                          </h2>
                          <span className={`status status-${claim.status}`}>{claim.status.replace(/_/g, " ")}</span>
                        </div>
                        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginTop: "4px" }}>
                          {claim.organization || "Unlisted"} · {claim.source_platform || "Manual proof"}{claim.role ? ` · ${claim.role}` : ""}
                        </p>
                        {claim.start_date && (
                          <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", marginTop: "2px" }}>
                            {claim.start_date} → {claim.end_date || "Present"}
                            {claim.community_size ? ` · ${claim.community_size.toLocaleString()} members` : ""}
                          </p>
                        )}
                      </div>
                    </div>

                    <label className="label" style={{ width: "200px", flexShrink: 0 }}>
                      Verification level
                      <select
                        className="input"
                        value={state.verification_level}
                        onChange={(e) => setReviewState({ ...reviewState, [claim.id]: { ...state, verification_level: Number(e.target.value) } })}
                      >
                        <option value={1}>1 — Self-reported</option>
                        <option value={2}>2 — Account-linked</option>
                        <option value={3}>3 — Platform verified</option>
                        <option value={4}>4 — Community verified</option>
                        <option value={5}>5 — Institution verified</option>
                      </select>
                    </label>
                  </div>
                </div>

                {/* Evidence detail grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", background: "var(--border)" }}>
                  {[
                    { label: "Responsibilities", value: claim.responsibilities },
                    { label: "Outcomes", value: claim.outcomes },
                    { label: "Proof notes", value: claim.proof_notes },
                  ].map(({ label, value }) => (
                    <div key={label} className="panel" style={{ padding: "14px 16px" }}>
                      <ML>{label}</ML>
                      <p style={{ fontSize: "14px", color: value ? "var(--text)" : "var(--text-dim)", marginTop: "8px", lineHeight: 1.6, fontStyle: value ? "normal" : "italic" }}>
                        {value || "Not submitted."}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reviewer notes */}
                <label className="label">
                  Reviewer notes
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="Add notes for the user about this decision..."
                    value={state.notes}
                    onChange={(e) => setReviewState({ ...reviewState, [claim.id]: { ...state, notes: e.target.value } })}
                  />
                </label>

                {/* Action buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", paddingTop: "4px" }}>
                  <button className="btn-primary" type="submit">
                    <BadgeCheck size={14} /> Approve at Level {state.verification_level}
                  </button>
                  <button className="btn-secondary" type="button" onClick={(e) => review(e, claim.id, "request-info")}>
                    <MessageSquareMore size={14} /> Request more info
                  </button>
                  <button className="btn-danger" type="button" onClick={(e) => review(e, claim.id, "reject")}>
                    <CircleSlash size={14} /> Reject
                  </button>
                </div>
              </div>
            </form>
          );
        })}
      </section>
    </main>
  );
}
