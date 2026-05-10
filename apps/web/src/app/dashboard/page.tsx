"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Check,
  ChevronRight,
  ClipboardCopy,
  Download,
  ExternalLink,
  FilePlus2,
  Gamepad2,
  LogOut,
  Map,
  Save,
  Send,
  ShieldCheck,
  User,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch, downloadPdf } from "@/lib/api";
import { CareerTrack, EvidenceClaim, EvidenceKind, MeResponse, Passport, Profile } from "@/lib/types";

type Tab = "profile" | "evidence" | "passport";

const evidenceLabels: Record<EvidenceKind, string> = {
  discord_admin: "Discord Admin",
  esports_player: "Esports Player",
  tournament_organizer: "Tournament Organizer",
  club_member: "Club Member",
  guild_leader: "Guild Leader",
};

const evidenceIcons: Record<EvidenceKind, string> = {
  discord_admin: "💬",
  esports_player: "🎮",
  tournament_organizer: "🏆",
  club_member: "🎓",
  guild_leader: "⚔️",
};

const verificationLevelLabel: Record<number, string> = {
  1: "Self-reported",
  2: "Account-linked",
  3: "Platform verified",
  4: "Community verified",
  5: "Institution verified",
};

type ProfileForm = {
  name: string;
  username: string;
  headline: string;
  college: string;
  graduation_year: string;
  bio: string;
  role_identity: string;
  visibility_public: boolean;
};

type EvidenceForm = {
  kind: EvidenceKind;
  title: string;
  organization: string;
  source_platform: string;
  role: string;
  start_date: string;
  end_date: string;
  community_size: string;
  responsibilities: string;
  outcomes: string;
  proof_notes: string;
};

const emptyEvidence: EvidenceForm = {
  kind: "discord_admin",
  title: "",
  organization: "",
  source_platform: "Discord",
  role: "",
  start_date: "",
  end_date: "",
  community_size: "",
  responsibilities: "",
  outcomes: "",
  proof_notes: "",
};

function profileToForm(profile: Profile | null, email: string): ProfileForm {
  const fallback = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return {
    name: profile?.name || "",
    username: profile?.username || fallback || "player001",
    headline: profile?.headline || "Digital community and esports operator",
    college: profile?.college || "",
    graduation_year: profile?.graduation_year ? String(profile.graduation_year) : "",
    bio: profile?.bio || "",
    role_identity: profile?.role_identity || "Community operator",
    visibility_public: profile?.visibility_public ?? true,
  };
}

function SignalBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div className="space-y-1">
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
        title="Copy bullet"
        type="button"
      >
        {copied ? (
          <Check size={14} className="text-green-400" />
        ) : (
          <ClipboardCopy size={14} />
        )}
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
        <h3 className="section-title">Career track suggestions</h3>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Based on your verified evidence patterns. These are suggestions, not guarantees.
      </p>
      {strong.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-[var(--cyan)] uppercase tracking-widest">Strong fit</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {strong.map((t) => (
              <div key={t.track} className="track-strong flex items-center gap-2">
                <Briefcase size={14} className="text-[var(--cyan)] shrink-0" />
                <span className="text-sm font-semibold text-white">{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {moderate.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-purple-400 uppercase tracking-widest">Moderate fit</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {moderate.map((t) => (
              <div key={t.track} className="track-moderate flex items-center gap-2">
                <BookOpen size={14} className="text-purple-400 shrink-0" />
                <span className="text-sm font-semibold text-[var(--text-secondary)]">{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [claims, setClaims] = useState<EvidenceClaim[]>([]);
  const [passport, setPassport] = useState<Passport | null>(null);
  const [profileForm, setProfileForm] = useState<ProfileForm | null>(null);
  const [evidenceForm, setEvidenceForm] = useState<EvidenceForm>(emptyEvidence);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [message, setMessage] = useState({ text: "", kind: "notice" as "notice" | "notice-success" | "notice-error" });
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("profile");

  useEffect(() => { setChartsReady(true); }, []);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const current = await apiFetch<MeResponse>("/me", { token });
      const evidence = await apiFetch<EvidenceClaim[]>("/evidence", { token });
      setMe(current);
      setClaims(evidence);
      setProfileForm(profileToForm(current.profile, current.user.email));
      try {
        setPassport(await apiFetch<Passport>("/passport/me", { token }));
      } catch {
        setPassport(null);
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not load dashboard", kind: "notice-error" });
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

  const breakdownChart = useMemo(() => {
    if (!passport) return [];
    return Object.entries(passport.verification_breakdown).map(([name, value]) => ({
      name: name.replace(/_/g, " "),
      value,
    }));
  }, [passport]);

  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const pendingCount = claims.filter((c) => ["submitted", "under_review"].includes(c.status)).length;

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !profileForm) return;
    setMessage({ text: "", kind: "notice" });
    try {
      await apiFetch<Profile>("/profile", {
        method: "PATCH",
        token,
        body: {
          ...profileForm,
          graduation_year: profileForm.graduation_year ? Number(profileForm.graduation_year) : null,
        },
      });
      setMessage({ text: "Profile saved successfully.", kind: "notice-success" });
      await load();
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not save profile", kind: "notice-error" });
    }
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage({ text: "", kind: "notice" });
    try {
      const claim = await apiFetch<EvidenceClaim>("/evidence", {
        method: "POST",
        token,
        body: {
          ...evidenceForm,
          start_date: evidenceForm.start_date || null,
          end_date: evidenceForm.end_date || null,
          community_size: evidenceForm.community_size ? Number(evidenceForm.community_size) : null,
        },
      });

      if (proofFile) {
        const formData = new FormData();
        formData.set("file", proofFile);
        await apiFetch(`/evidence/${claim.id}/files`, { method: "POST", token, body: formData });
      }

      setEvidenceForm(emptyEvidence);
      setProofFile(null);
      setMessage({ text: "Evidence submitted for admin review.", kind: "notice-success" });
      await load();
      setActiveTab("evidence");
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not submit evidence", kind: "notice-error" });
    }
  }

  async function exportPdf() {
    if (!token) return;
    try {
      const blob = await downloadPdf("/passport/export-pdf", token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `omniskill-${me?.profile?.username || "passport"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "Could not export PDF", kind: "notice-error" });
    }
  }

  function logout() {
    window.localStorage.removeItem("omniskill_token");
    router.push("/");
  }

  if (loading || !profileForm) {
    return (
      <main className="app-bg flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)]">
          <Gamepad2 size={20} className="text-[var(--cyan)] animate-pulse" />
          Loading your passport workspace...
        </div>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-[rgba(8,11,20,0.85)] backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 lg:px-8">
          <div className="flex items-center gap-3">
            <Gamepad2 size={18} className="text-[var(--cyan)]" />
            <span className="text-sm font-black logo-glow">OMNI-SKILL</span>
            <span className="hidden text-[var(--border)] sm:inline">|</span>
            <span className="hidden text-xs text-[var(--text-muted)] sm:inline">Passport Workspace</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {/* Quick stats */}
            <div className="hidden items-center gap-3 text-xs sm:flex">
              <span className="chip chip-cyan">{approvedCount} verified</span>
              {pendingCount > 0 && <span className="chip chip-amber">{pendingCount} pending</span>}
            </div>
            {me?.user.role === "admin" && (
              <Link className="btn-secondary text-xs" href="/admin">
                <ShieldCheck size={14} /> Admin
              </Link>
            )}
            {me?.profile?.username && (
              <Link className="btn-secondary text-xs" href={`/passport/${me.profile.username}`} target="_blank">
                <ExternalLink size={14} /> View passport
              </Link>
            )}
            <button className="btn-ghost text-xs" type="button" onClick={logout}>
              <LogOut size={14} /> Sign out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="tab-bar">
            {(
              [
                { id: "profile" as Tab, icon: User, label: "Profile" },
                { id: "evidence" as Tab, icon: Activity, label: `Evidence${claims.length ? ` (${claims.length})` : ""}` },
                { id: "passport" as Tab, icon: BadgeCheck, label: `Passport${passport?.skill_cards.length ? ` (${passport.skill_cards.length})` : ""}` },
              ] as const
            ).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`tab-btn ${activeTab === id ? "tab-btn-active" : ""}`}
              >
                <Icon size={14} className="inline mr-1.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-6 lg:px-8">
        {message.text && (
          <div className={`${message.kind} mb-5 flex items-center gap-2`}>
            {message.kind === "notice-success" && <Check size={16} />}
            {message.text}
          </div>
        )}

        {/* ─── PROFILE TAB ─── */}
        {activeTab === "profile" && (
          <div className="mx-auto max-w-2xl">
            <form className="panel space-y-5" onSubmit={saveProfile}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">Career identity</p>
                  <h2 className="section-title mt-1">Your profile</h2>
                </div>
                <button className="btn-primary" type="submit">
                  <Save size={15} /> Save profile
                </button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="label">
                  Full name
                  <input
                    className="input"
                    placeholder="Alex Chen"
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  />
                </label>
                <label className="label">
                  Username
                  <input
                    className="input"
                    placeholder="alexchen99"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                  />
                </label>
                <label className="label sm:col-span-2">
                  Headline
                  <input
                    className="input"
                    placeholder="Esports team captain & Discord community operator"
                    value={profileForm.headline}
                    onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  />
                </label>
                <label className="label">
                  College / University
                  <input
                    className="input"
                    placeholder="VIT University"
                    value={profileForm.college}
                    onChange={(e) => setProfileForm({ ...profileForm, college: e.target.value })}
                  />
                </label>
                <label className="label">
                  Graduation year
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="2026"
                    value={profileForm.graduation_year}
                    onChange={(e) => setProfileForm({ ...profileForm, graduation_year: e.target.value })}
                  />
                </label>
                <label className="label">
                  Role identity
                  <input
                    className="input"
                    placeholder="Community operator & Esports coordinator"
                    value={profileForm.role_identity}
                    onChange={(e) => setProfileForm({ ...profileForm, role_identity: e.target.value })}
                  />
                </label>
                <label className="label-row sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={profileForm.visibility_public}
                    onChange={(e) => setProfileForm({ ...profileForm, visibility_public: e.target.checked })}
                  />
                  Make passport publicly shareable
                </label>
                <label className="label sm:col-span-2">
                  Bio
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Describe your gaming background, community work, and what kind of career you're building toward..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </label>
              </div>

              {me?.profile?.username && (
                <div className="rounded-lg border border-[var(--border-cyan)] bg-[var(--cyan-dim)] p-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold text-[var(--cyan)]">Your public passport URL</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      omniskill.app/passport/{me.profile.username}
                    </p>
                  </div>
                  <Link
                    href={`/passport/${me.profile.username}`}
                    target="_blank"
                    className="btn-secondary text-xs shrink-0"
                  >
                    <ExternalLink size={13} /> Open
                  </Link>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ─── EVIDENCE TAB ─── */}
        {activeTab === "evidence" && (
          <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
            {/* Submit form */}
            <form className="panel space-y-4" onSubmit={submitEvidence}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">New claim</p>
                  <h2 className="section-title mt-1">Submit evidence</h2>
                </div>
                <button className="btn-primary" type="submit">
                  <Send size={15} /> Submit
                </button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="label">
                  Evidence type
                  <select
                    className="input"
                    value={evidenceForm.kind}
                    onChange={(e) => {
                      const kind = e.target.value as EvidenceKind;
                      const platformMap: Partial<Record<EvidenceKind, string>> = {
                        discord_admin: "Discord",
                        esports_player: "FACEIT",
                        tournament_organizer: "Manual proof",
                        club_member: "College",
                        guild_leader: "Discord",
                      };
                      setEvidenceForm({
                        ...evidenceForm,
                        kind,
                        source_platform: platformMap[kind] || "",
                      });
                    }}
                  >
                    {Object.entries(evidenceLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {evidenceIcons[value as EvidenceKind]} {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="label">
                  Source platform
                  <input
                    className="input"
                    placeholder="Discord, FACEIT, Manual..."
                    value={evidenceForm.source_platform}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, source_platform: e.target.value })}
                  />
                </label>
                <label className="label sm:col-span-2">
                  Title / Claim
                  <input
                    required
                    className="input"
                    placeholder="e.g. Moderated 2,000+ member Discord server for 18 months"
                    value={evidenceForm.title}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })}
                  />
                </label>
                <label className="label">
                  Organization / Community
                  <input
                    className="input"
                    placeholder="Community name or team"
                    value={evidenceForm.organization}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, organization: e.target.value })}
                  />
                </label>
                <label className="label">
                  Your role
                  <input
                    className="input"
                    placeholder="Head Moderator, Team Captain..."
                    value={evidenceForm.role}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, role: e.target.value })}
                  />
                </label>
                <label className="label">
                  Start date
                  <input
                    className="input"
                    type="date"
                    value={evidenceForm.start_date}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, start_date: e.target.value })}
                  />
                </label>
                <label className="label">
                  End date
                  <input
                    className="input"
                    type="date"
                    value={evidenceForm.end_date}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, end_date: e.target.value })}
                  />
                </label>
                <label className="label">
                  Community size (members)
                  <input
                    className="input"
                    inputMode="numeric"
                    placeholder="2000"
                    value={evidenceForm.community_size}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, community_size: e.target.value })}
                  />
                </label>
                <label className="label">
                  Proof file
                  <input
                    className="file-input"
                    type="file"
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setProofFile(e.target.files?.[0] || null)}
                  />
                </label>
                <label className="label sm:col-span-2">
                  Responsibilities
                  <textarea
                    className="textarea"
                    rows={3}
                    placeholder="What did you actually do in this role?"
                    value={evidenceForm.responsibilities}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, responsibilities: e.target.value })}
                  />
                </label>
                <label className="label sm:col-span-2">
                  Outcomes
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="Measurable results: grew server by X%, organized Y events..."
                    value={evidenceForm.outcomes}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, outcomes: e.target.value })}
                  />
                </label>
                <label className="label sm:col-span-2">
                  Proof notes
                  <textarea
                    className="textarea"
                    rows={2}
                    placeholder="Describe what your uploaded proof shows..."
                    value={evidenceForm.proof_notes}
                    onChange={(e) => setEvidenceForm({ ...evidenceForm, proof_notes: e.target.value })}
                  />
                </label>
              </div>
            </form>

            {/* Evidence timeline */}
            <div className="panel space-y-4">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-[var(--cyan)]" />
                <h2 className="section-title">Evidence timeline</h2>
              </div>

              {/* Status legend */}
              <div className="flex flex-wrap gap-2">
                {["submitted", "under_review", "needs_more_info", "approved", "rejected"].map((s) => (
                  <span key={s} className={`status status-${s}`}>{s.replace(/_/g, " ")}</span>
                ))}
              </div>

              <div className="space-y-3">
                {claims.length ? (
                  claims.map((claim) => (
                    <article
                      key={claim.id}
                      className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 hover:border-[var(--border-cyan)] transition-all"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-start gap-2">
                          <span className="text-lg leading-none mt-0.5">
                            {evidenceIcons[claim.kind]}
                          </span>
                          <div>
                            <h3 className="font-semibold text-white text-sm">{claim.title}</h3>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {evidenceLabels[claim.kind]} · {claim.source_platform || "Manual proof"}
                              {claim.organization ? ` · ${claim.organization}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`status status-${claim.status} shrink-0`}>
                          {claim.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      {claim.reviewer_notes ? (
                        <p className="mt-3 text-xs text-[var(--text-secondary)] border-l-2 border-[var(--border-cyan)] pl-3">
                          {claim.reviewer_notes}
                        </p>
                      ) : null}
                      {claim.status === "approved" && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
                          <BadgeCheck size={12} />
                          {verificationLevelLabel[claim.verification_level] || "Verified"} · Level {claim.verification_level}
                        </div>
                      )}
                    </article>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-[var(--border)] p-8 text-center">
                    <FilePlus2 size={24} className="text-[var(--text-muted)]" />
                    <p className="text-sm text-[var(--text-muted)]">No evidence claims yet.</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Use the form on the left to submit your first claim.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ─── PASSPORT TAB ─── */}
        {activeTab === "passport" && (
          <div className="space-y-5">
            {/* Passport header */}
            <div className="panel panel-glow">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="eyebrow">Verified output</p>
                  <h2 className="section-title mt-1">Your Omni-Skill Passport</h2>
                  {passport && (
                    <p className="mt-2 text-sm text-[var(--text-secondary)] max-w-2xl">
                      {passport.career_summary}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  {me?.profile?.username && (
                    <Link
                      href={`/passport/${me.profile.username}`}
                      target="_blank"
                      className="btn-secondary text-xs"
                    >
                      <ExternalLink size={14} /> Public view
                    </Link>
                  )}
                  <button className="btn-primary text-xs" type="button" onClick={exportPdf} disabled={!passport}>
                    <Download size={14} /> Export PDF
                  </button>
                </div>
              </div>
            </div>

            {passport ? (
              <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
                {/* Left column */}
                <div className="space-y-5">
                  {/* Signal strength */}
                  {passport.skill_cards.length > 0 && (
                    <div className="panel space-y-4">
                      <div className="flex items-center gap-2">
                        <Activity size={18} className="text-[var(--cyan)]" />
                        <h3 className="section-title">Signal strength</h3>
                      </div>
                      <div className="space-y-3">
                        {passport.skill_cards.map((card) => (
                          <SignalBar
                            key={card.id}
                            label={card.signal_name}
                            value={card.confidence}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Verification breakdown chart */}
                  {breakdownChart.length > 0 && chartsReady && (
                    <div className="panel space-y-3">
                      <div>
                        <p className="eyebrow">Verification breakdown</p>
                        <h3 className="section-title mt-1">Evidence by level</h3>
                      </div>
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={180}>
                          <BarChart data={breakdownChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis
                              dataKey="name"
                              tick={{ fontSize: 9, fill: "#475569" }}
                              axisLine={{ stroke: "rgba(255,255,255,0.07)" }}
                              tickLine={false}
                            />
                            <YAxis
                              allowDecimals={false}
                              tick={{ fontSize: 10, fill: "#475569" }}
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
                            <Bar dataKey="value" fill="#00d4ff" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Career tracks */}
                  {passport.career_tracks && passport.career_tracks.length > 0 && (
                    <CareerTracks tracks={passport.career_tracks} />
                  )}
                </div>

                {/* Right column */}
                <div className="space-y-5">
                  {/* Evidence cards */}
                  <div className="panel space-y-4">
                    <div className="flex items-center gap-2">
                      <BadgeCheck size={18} className="text-[var(--cyan)]" />
                      <h3 className="section-title">Evidence cards</h3>
                    </div>
                    <div className="space-y-3">
                      {passport.skill_cards.map((card) => (
                        <article
                          key={card.id}
                          className="rounded-xl border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-4 hover:border-[var(--border-cyan)] transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <h4 className="font-bold text-white text-sm">{card.signal_name}</h4>
                            <span className="chip">
                              <BadgeCheck size={11} /> Lv {card.verification_level}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] leading-5">{card.career_translation}</p>
                          {card.limitations && (
                            <p className="mt-2 text-xs text-[var(--text-muted)] italic">{card.limitations}</p>
                          )}
                          {card.supporting_facts.length > 0 && (
                            <div className="mt-3 space-y-1">
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
                  </div>

                  {/* Resume bullets */}
                  <div className="panel space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Briefcase size={18} className="text-[var(--cyan)]" />
                        <h3 className="section-title">Resume bullets</h3>
                      </div>
                      <span className="text-xs text-[var(--text-muted)]">Click bullet to copy</span>
                    </div>
                    {passport.resume_bullets.length ? (
                      <div className="space-y-2">
                        {passport.resume_bullets.map((bullet) => (
                          <CopyBullet key={bullet.id} text={bullet.bullet} />
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[var(--text-muted)]">
                        Resume bullets appear after evidence is approved.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-[var(--border)] p-16 text-center">
                <BadgeCheck size={40} className="text-[var(--text-muted)]" />
                <div>
                  <p className="font-semibold text-[var(--text-secondary)]">No passport generated yet</p>
                  <p className="mt-1 text-sm text-[var(--text-muted)] max-w-sm">
                    Save your profile and get at least one evidence claim approved to generate your first passport.
                  </p>
                </div>
                <button
                  className="btn-secondary text-xs"
                  type="button"
                  onClick={() => setActiveTab("evidence")}
                >
                  <FilePlus2 size={14} /> Submit evidence
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
