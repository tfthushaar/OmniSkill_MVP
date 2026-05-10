"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Check,
  ChevronRight,
  ClipboardCopy,
  ExternalLink,
  Gamepad2,
  Map,
  ShieldCheck,
} from "lucide-react";

import { apiFetch } from "@/lib/api";
import { CareerTrack, Passport } from "@/lib/types";

const verificationLevelLabel: Record<number, string> = {
  1: "Self-reported",
  2: "Account-linked",
  3: "Platform verified",
  4: "Community verified",
  5: "Institution verified",
};

function CopyBullet({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <div className="group flex items-start gap-3 rounded-lg border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-3 hover:border-[var(--border-cyan)] transition-all">
      <ChevronRight size={14} className="mt-0.5 shrink-0 text-[var(--cyan)]" />
      <p className="flex-1 text-sm text-[var(--text-secondary)] leading-6">{text}</p>
      <button
        onClick={copy}
        className="btn-ghost shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5"
        title="Copy"
        type="button"
      >
        {copied ? <Check size={14} className="text-green-400" /> : <ClipboardCopy size={14} />}
      </button>
    </div>
  );
}

function CareerTracks({ tracks }: { tracks: CareerTrack[] }) {
  const strong = tracks.filter((t) => t.fit === "strong");
  const moderate = tracks.filter((t) => t.fit === "moderate");
  if (!tracks.length) return null;
  return (
    <div className="panel space-y-4">
      <div className="flex items-center gap-2">
        <Map size={18} className="text-[var(--cyan)]" />
        <h2 className="section-title">Career track suggestions</h2>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Based on verified evidence patterns. These are informed suggestions, not guarantees.
      </p>
      {strong.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[var(--cyan)] uppercase tracking-widest">Strong fit</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {strong.map((t) => (
              <div key={t.track} className="track-strong flex items-center gap-2">
                <Briefcase size={13} className="text-[var(--cyan)] shrink-0" />
                <span className="text-sm font-semibold text-white">{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {moderate.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Moderate fit</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {moderate.map((t) => (
              <div key={t.track} className="track-moderate flex items-center gap-2">
                <BookOpen size={13} className="text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SignalBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-bold text-[var(--cyan)]">{pct}%</span>
      </div>
      <div className="signal-bar">
        <div className="signal-bar-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PublicPassportPage() {
  const params = useParams<{ username: string }>();
  const [passport, setPassport] = useState<Passport | null>(null);
  const [message, setMessage] = useState("");
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setPassport(await apiFetch<Passport>(`/passport/public/${params.username}`));
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Passport not found");
      }
    }
    if (params.username) void load();
  }, [params.username]);

  function copyLink() {
    void navigator.clipboard.writeText(window.location.href).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  if (message) {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center px-4">
        <div className="panel panel-glow max-w-md text-center space-y-4">
          <Gamepad2 size={32} className="text-[var(--text-muted)] mx-auto" />
          <h1 className="section-title">Passport unavailable</h1>
          <p className="text-sm text-[var(--text-secondary)]">{message}</p>
          <Link className="btn-secondary inline-flex" href="/">
            <ArrowLeft size={16} /> Omni-Skill
          </Link>
        </div>
      </main>
    );
  }

  if (!passport) {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Gamepad2 size={20} className="text-[var(--cyan)] animate-pulse" />
          Loading passport...
        </div>
      </main>
    );
  }

  const displayName = passport.profile.name || passport.profile.username;
  const hasTracks = passport.career_tracks && passport.career_tracks.length > 0;

  return (
    <main className="app-bg min-h-screen">
      {/* Nav */}
      <nav className="border-b border-[var(--border)] bg-[rgba(8,11,20,0.85)] backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <ArrowLeft size={16} className="text-[var(--text-muted)]" />
            <Gamepad2 size={16} className="text-[var(--cyan)]" />
            <span className="text-xs font-black logo-glow">OMNI-SKILL</span>
          </Link>
          <button
            onClick={copyLink}
            className="btn-secondary text-xs"
            type="button"
          >
            {linkCopied ? (
              <><Check size={13} className="text-green-400" /> Link copied!</>
            ) : (
              <><ClipboardCopy size={13} /> Share passport</>
            )}
          </button>
        </div>
      </nav>

      {/* Profile header */}
      <section className="border-b border-[var(--border)] bg-[rgba(13,18,37,0.6)] backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
          <div className="grid gap-6 md:grid-cols-[1fr_260px] md:items-start">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="chip chip-cyan text-[10px]">Verified career evidence</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-white">{displayName}</h1>
              <p className="text-lg text-[var(--text-secondary)]">
                {passport.profile.headline || passport.profile.role_identity}
              </p>
              {passport.profile.college && (
                <p className="text-sm text-[var(--text-muted)]">
                  {passport.profile.college}
                  {passport.profile.graduation_year ? ` · Class of ${passport.profile.graduation_year}` : ""}
                </p>
              )}
              {passport.career_summary && (
                <p className="text-sm text-[var(--text-secondary)] leading-7 max-w-2xl border-l-2 border-[var(--border-cyan)] pl-4">
                  {passport.career_summary}
                </p>
              )}
            </div>

            {/* Verification breakdown card */}
            <div className="panel space-y-4">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[var(--cyan)]" />
                <h2 className="text-sm font-bold text-white">Verification breakdown</h2>
              </div>
              {Object.entries(passport.verification_breakdown).length ? (
                <div className="space-y-2">
                  {Object.entries(passport.verification_breakdown).map(([label, count]) => (
                    <div key={label} className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)] capitalize">
                        {label.replace(/_/g, " ")}
                      </span>
                      <span className="font-bold text-white bg-[rgba(0,212,255,0.1)] border border-[var(--border-cyan)] rounded-full px-2 py-0.5 text-[var(--cyan)]">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)]">No approved evidence yet.</p>
              )}
              <div className="divider" />
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-muted)]">Total verified</span>
                <span className="font-black text-[var(--cyan)]">
                  {Object.values(passport.verification_breakdown).reduce((a, b) => a + b, 0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main content */}
      <section className="mx-auto max-w-5xl px-4 py-8 lg:px-8 space-y-6">
        {/* Signal strength */}
        {passport.skill_cards.length > 0 && (
          <div className="panel space-y-4">
            <div className="flex items-center gap-2">
              <ExternalLink size={16} className="text-[var(--cyan)]" />
              <h2 className="section-title">Signal strength</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {passport.skill_cards.map((card) => (
                <SignalBar key={card.id} label={card.signal_name} value={card.confidence} />
              ))}
            </div>
          </div>
        )}

        {/* Career tracks */}
        {hasTracks && <CareerTracks tracks={passport.career_tracks} />}

        {/* Evidence cards */}
        <div className="panel space-y-4">
          <div className="flex items-center gap-2">
            <BadgeCheck size={18} className="text-[var(--cyan)]" />
            <h2 className="section-title">Evidence cards</h2>
          </div>
          {passport.skill_cards.length ? (
            <div className="grid gap-3 md:grid-cols-2">
              {passport.skill_cards.map((card) => (
                <article
                  key={card.id}
                  className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 hover:border-[var(--border-cyan)] transition-all"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h3 className="font-bold text-white">{card.signal_name}</h3>
                    <span className="chip">
                      <BadgeCheck size={11} />
                      {verificationLevelLabel[card.verification_level] || `Level ${card.verification_level}`}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] leading-6">{card.career_translation}</p>
                  {card.limitations && (
                    <p className="mt-3 text-xs text-[var(--text-muted)] italic">{card.limitations}</p>
                  )}
                  {card.supporting_facts.length > 0 && (
                    <div className="mt-3 space-y-1 pt-3 border-t border-[var(--border)]">
                      {card.supporting_facts.map((fact, i) => (
                        <p key={i} className="text-xs text-[var(--text-muted)] flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-[var(--cyan)] inline-block shrink-0" />
                          {fact}
                        </p>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">No approved evidence cards yet.</p>
          )}
        </div>

        {/* Resume bullets */}
        <div className="panel space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Briefcase size={18} className="text-[var(--cyan)]" />
              <h2 className="section-title">Resume bullets</h2>
            </div>
            <span className="text-xs text-[var(--text-muted)]">Hover to copy</span>
          </div>
          {passport.resume_bullets.length ? (
            <div className="space-y-2">
              {passport.resume_bullets.map((bullet) => (
                <CopyBullet key={bullet.id} text={bullet.bullet} />
              ))}
            </div>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">Resume bullets appear after evidence is approved.</p>
          )}
        </div>

        {/* Footer CTA */}
        <div className="panel panel-glow text-center space-y-3 py-8">
          <Gamepad2 size={28} className="text-[var(--cyan)] mx-auto" />
          <h3 className="font-bold text-white">Build your own Omni-Skill Passport</h3>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
            Turn your gaming, esports, and community experience into verified career evidence.
          </p>
          <Link href="/" className="btn-primary inline-flex">
            Start your passport
          </Link>
        </div>
      </section>
    </main>
  );
}
