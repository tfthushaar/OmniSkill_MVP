"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BadgeCheck, BriefcaseBusiness, ShieldCheck } from "lucide-react";

import { apiFetch } from "@/lib/api";
import { Passport } from "@/lib/types";

export default function PublicPassportPage() {
  const params = useParams<{ username: string }>();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setPassport(await apiFetch<Passport>(`/passport/public/${params.username}`));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Passport not found");
      }
    }

    if (params.username) {
      void load();
    }
  }, [params.username]);

  if (message) {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center px-4">
        <div className="panel max-w-md text-center">
          <h1 className="section-title">Passport unavailable</h1>
          <p className="mt-2 text-sm text-slate-600">{message}</p>
          <Link className="btn-secondary mt-4 inline-flex" href="/">
            <ArrowLeft size={16} /> Home
          </Link>
        </div>
      </main>
    );
  }

  if (!passport) {
    return <main className="app-bg flex min-h-screen items-center justify-center text-sm text-slate-600">Loading passport...</main>;
  }

  return (
    <main className="app-bg min-h-screen">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 lg:px-8">
          <Link className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950" href="/">
            <ArrowLeft size={16} /> Omni-Skill
          </Link>
          <div className="grid gap-6 md:grid-cols-[1fr_260px] md:items-end">
            <div>
              <p className="eyebrow">Verified career evidence</p>
              <h1 className="mt-2 text-4xl font-semibold text-slate-950">{passport.profile.name || passport.profile.username}</h1>
              <p className="mt-3 max-w-2xl text-lg text-slate-700">{passport.profile.headline || passport.profile.role_identity}</p>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{passport.career_summary}</p>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
                <ShieldCheck className="text-teal-700" size={18} /> Verification breakdown
              </div>
              <div className="mt-3 space-y-2">
                {Object.entries(passport.verification_breakdown).length ? (
                  Object.entries(passport.verification_breakdown).map(([label, count]) => (
                    <div className="flex items-center justify-between text-sm" key={label}>
                      <span className="text-slate-600">{label.replaceAll("_", " ")}</span>
                      <span className="font-semibold text-slate-950">{count}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">No approved evidence yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-4 py-6 lg:px-8">
        <div className="panel">
          <div className="flex items-center gap-2">
            <BadgeCheck className="text-teal-700" size={18} />
            <h2 className="section-title">Evidence cards</h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {passport.skill_cards.map((card) => (
              <article className="rounded-lg border border-slate-200 p-4" key={card.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-950">{card.signal_name}</h3>
                  <span className="chip">Level {card.verification_level}</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{card.career_translation}</p>
                <p className="mt-3 text-xs text-slate-500">{card.limitations}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="panel">
          <div className="flex items-center gap-2">
            <BriefcaseBusiness className="text-teal-700" size={18} />
            <h2 className="section-title">Resume bullets</h2>
          </div>
          <div className="mt-4 space-y-3">
            {passport.resume_bullets.length ? (
              passport.resume_bullets.map((bullet) => (
                <p className="rounded-lg border border-slate-200 p-3 text-sm text-slate-700" key={bullet.id}>
                  {bullet.bullet}
                </p>
              ))
            ) : (
              <p className="text-sm text-slate-500">Resume bullets appear after evidence is approved.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

