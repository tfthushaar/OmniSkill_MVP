"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CircleSlash, Gamepad2, MessageSquareMore, ShieldCheck } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { EvidenceClaim } from "@/lib/types";

const evidenceIcons: Record<string, string> = {
  discord_admin: "💬",
  esports_player: "🎮",
  tournament_organizer: "🏆",
  club_member: "🎓",
  guild_leader: "⚔️",
};

type ReviewState = Record<number, { verification_level: number; notes: string }>;

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [message, setMessage] = useState({ text: "", kind: "notice" as "notice" | "notice-success" | "notice-error" });
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const pending = await apiFetch<EvidenceClaim[]>("/admin/evidence/pending", { token });
      setClaims(pending);
      setReviewState(
        Object.fromEntries(
          pending.map((claim) => [
            claim.id,
            { verification_level: Math.max(3, claim.verification_level || 3), notes: claim.reviewer_notes || "" },
          ]),
        ),
      );
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not load admin queue", kind: "notice-error" });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const saved = window.localStorage.getItem("omniskill_token");
    if (!saved) { router.push("/"); return; }
    setToken(saved);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function review(
    event: FormEvent<HTMLFormElement> | React.MouseEvent,
    claimId: number,
    action: "approve" | "reject" | "request-info",
  ) {
    event.preventDefault();
    if (!token) return;
    const payload = reviewState[claimId] || { verification_level: 3, notes: "" };
    try {
      await apiFetch(`/admin/evidence/${claimId}/${action}`, { method: "POST", token, body: payload });
      setMessage({ text: `Evidence ${action.replace("-", " ")} complete.`, kind: "notice-success" });
      await load();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not update evidence", kind: "notice-error" });
    }
  }

  return (
    <main className="app-bg min-h-screen">
      <header className="border-b border-[var(--border)] bg-[rgba(8,11,20,0.85)] backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <Gamepad2 size={18} className="text-[var(--cyan)]" />
            <span className="text-sm font-black logo-glow">OMNI-SKILL</span>
            <span className="hidden text-[var(--border)] sm:inline">|</span>
            <div className="hidden sm:flex items-center gap-2">
              <ShieldCheck size={14} className="text-[var(--cyan)]" />
              <span className="text-xs font-bold text-[var(--text-secondary)]">Verification Layer · Admin Queue</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {claims.length > 0 && (
              <span className="chip chip-amber text-[10px]">{claims.length} pending</span>
            )}
            <Link className="btn-secondary text-xs" href="/dashboard">
              <ArrowLeft size={14} /> Dashboard
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-4 px-4 py-6 lg:px-8">
        {message.text && (
          <div className={`${message.kind} flex items-center gap-2`}>{message.text}</div>
        )}

        {loading && (
          <div className="panel flex items-center gap-3 text-sm text-[var(--text-secondary)]">
            <Gamepad2 size={16} className="text-[var(--cyan)] animate-pulse" />
            Loading review queue...
          </div>
        )}

        {!loading && !claims.length && (
          <div className="panel panel-glow flex flex-col items-center gap-3 py-12 text-center">
            <ShieldCheck size={32} className="text-green-400" />
            <p className="font-semibold text-white">Queue is clear</p>
            <p className="text-sm text-[var(--text-muted)]">No submitted claims are waiting for review.</p>
          </div>
        )}

        {claims.map((claim) => {
          const state = reviewState[claim.id] || { verification_level: 3, notes: "" };
          return (
            <form
              key={claim.id}
              className="panel space-y-5"
              onSubmit={(e) => review(e, claim.id, "approve")}
            >
              {/* Header */}
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-1">{evidenceIcons[claim.kind] || "📋"}</span>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="section-title">{claim.title}</h2>
                      <span className={`status status-${claim.status}`}>{claim.status.replace(/_/g, " ")}</span>
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {claim.organization || "Unlisted organization"}
                      {" · "}{claim.source_platform || "Manual proof"}
                      {claim.role ? ` · ${claim.role}` : ""}
                    </p>
                    {claim.start_date && (
                      <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                        {claim.start_date} {claim.end_date ? `→ ${claim.end_date}` : "→ Present"}
                        {claim.community_size ? ` · ${claim.community_size.toLocaleString()} members` : ""}
                      </p>
                    )}
                  </div>
                </div>

                <label className="label w-full sm:w-48 shrink-0">
                  Verification level
                  <select
                    className="input"
                    value={state.verification_level}
                    onChange={(e) =>
                      setReviewState({
                        ...reviewState,
                        [claim.id]: { ...state, verification_level: Number(e.target.value) },
                      })
                    }
                  >
                    <option value={1}>1 — Self-reported</option>
                    <option value={2}>2 — Account-linked</option>
                    <option value={3}>3 — Platform verified</option>
                    <option value={4}>4 — Community verified</option>
                    <option value={5}>5 — Institution verified</option>
                  </select>
                </label>
              </div>

              {/* Evidence details */}
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  { label: "Responsibilities", value: claim.responsibilities },
                  { label: "Outcomes", value: claim.outcomes },
                  { label: "Proof notes", value: claim.proof_notes },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">{label}</p>
                    <p className="mt-2 text-sm text-[var(--text-secondary)] leading-6">
                      {value || <span className="italic text-[var(--text-muted)]">Not submitted.</span>}
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
                  onChange={(e) =>
                    setReviewState({ ...reviewState, [claim.id]: { ...state, notes: e.target.value } })
                  }
                />
              </label>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 pt-1">
                <button className="btn-primary" type="submit">
                  <BadgeCheck size={15} /> Approve at Level {state.verification_level}
                </button>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={(e) => review(e, claim.id, "request-info")}
                >
                  <MessageSquareMore size={15} /> Request more info
                </button>
                <button
                  className="btn-danger"
                  type="button"
                  onClick={(e) => review(e, claim.id, "reject")}
                >
                  <CircleSlash size={15} /> Reject
                </button>
              </div>
            </form>
          );
        })}
      </section>
    </main>
  );
}
