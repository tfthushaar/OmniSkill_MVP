"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, CircleSlash, MessageSquareMore, ShieldCheck } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { EvidenceClaim } from "@/lib/types";

type ReviewState = Record<number, { verification_level: number; notes: string }>;

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>({});
  const [message, setMessage] = useState("");
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
            {
              verification_level: Math.max(3, claim.verification_level || 3),
              notes: claim.reviewer_notes || "",
            },
          ]),
        ),
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load admin queue");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    const saved = window.localStorage.getItem("omniskill_token");
    if (!saved) {
      router.push("/");
      return;
    }
    setToken(saved);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  async function review(event: FormEvent<HTMLFormElement>, claimId: number, action: "approve" | "reject" | "request-info") {
    event.preventDefault();
    if (!token) return;
    const payload = reviewState[claimId] || { verification_level: 3, notes: "" };
    try {
      await apiFetch(`/admin/evidence/${claimId}/${action}`, {
        method: "POST",
        token,
        body: payload,
      });
      setMessage(`Evidence ${action.replace("-", " ")} complete.`);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update evidence");
    }
  }

  return (
    <main className="app-bg min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="eyebrow">Verification layer</p>
            <h1 className="text-2xl font-semibold text-slate-950">Admin evidence queue</h1>
          </div>
          <Link className="btn-secondary" href="/dashboard">
            <ArrowLeft size={16} /> Dashboard
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-4 px-4 py-6 lg:px-8">
        {message ? <div className="notice">{message}</div> : null}
        {loading ? <div className="panel text-sm text-slate-500">Loading review queue...</div> : null}

        {!loading && !claims.length ? (
          <div className="panel flex items-center gap-3 text-slate-600">
            <ShieldCheck className="text-teal-700" size={20} /> No submitted claims are waiting for review.
          </div>
        ) : null}

        {claims.map((claim) => {
          const state = reviewState[claim.id] || { verification_level: 3, notes: "" };
          return (
            <form className="panel space-y-4" key={claim.id} onSubmit={(event) => review(event, claim.id, "approve")}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="section-title">{claim.title}</h2>
                    <span className={`status status-${claim.status}`}>{claim.status.replaceAll("_", " ")}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {claim.organization || "Unlisted organization"} - {claim.source_platform || "Manual proof"} - {claim.role || "Role not specified"}
                  </p>
                </div>
                <label className="label w-full sm:w-44">
                  Level
                  <select
                    className="input"
                    value={state.verification_level}
                    onChange={(event) =>
                      setReviewState({
                        ...reviewState,
                        [claim.id]: { ...state, verification_level: Number(event.target.value) },
                      })
                    }
                  >
                    <option value={1}>1 Self-reported</option>
                    <option value={2}>2 Account-linked</option>
                    <option value={3}>3 Platform verified</option>
                    <option value={4}>4 Community verified</option>
                    <option value={5}>5 Institution verified</option>
                  </select>
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Responsibilities</p>
                  <p className="mt-2 text-sm text-slate-700">{claim.responsibilities || "No detail submitted."}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Outcomes</p>
                  <p className="mt-2 text-sm text-slate-700">{claim.outcomes || "No outcome submitted."}</p>
                </div>
                <div className="rounded-lg border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase text-slate-500">Proof notes</p>
                  <p className="mt-2 text-sm text-slate-700">{claim.proof_notes || "No notes submitted."}</p>
                </div>
              </div>

              <label className="label">
                Reviewer notes
                <textarea
                  className="textarea"
                  rows={3}
                  value={state.notes}
                  onChange={(event) =>
                    setReviewState({
                      ...reviewState,
                      [claim.id]: { ...state, notes: event.target.value },
                    })
                  }
                />
              </label>

              <div className="flex flex-wrap gap-2">
                <button className="btn-primary" type="submit">
                  <BadgeCheck size={16} /> Approve
                </button>
                <button className="btn-secondary" type="button" onClick={(event) => review(event as unknown as FormEvent<HTMLFormElement>, claim.id, "request-info")}>
                  <MessageSquareMore size={16} /> More info
                </button>
                <button className="btn-danger" type="button" onClick={(event) => review(event as unknown as FormEvent<HTMLFormElement>, claim.id, "reject")}>
                  <CircleSlash size={16} /> Reject
                </button>
              </div>
            </form>
          );
        })}
      </section>
    </main>
  );
}
