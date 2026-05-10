"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Download,
  ExternalLink,
  FilePlus2,
  LogOut,
  Save,
  Send,
  ShieldCheck,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { apiFetch, downloadPdf } from "@/lib/api";
import { EvidenceClaim, EvidenceKind, MeResponse, Passport, Profile } from "@/lib/types";

const evidenceLabels: Record<EvidenceKind, string> = {
  discord_admin: "Discord admin",
  esports_player: "Esports player",
  tournament_organizer: "Tournament organizer",
  club_member: "Club member",
  guild_leader: "Guild leader",
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
  const fallbackUsername = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return {
    name: profile?.name || "",
    username: profile?.username || fallbackUsername || "player001",
    headline: profile?.headline || "Digital community and esports operator",
    college: profile?.college || "",
    graduation_year: profile?.graduation_year ? String(profile.graduation_year) : "",
    bio: profile?.bio || "",
    role_identity: profile?.role_identity || "Community operator",
    visibility_public: profile?.visibility_public ?? true,
  };
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
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);

  useEffect(() => {
    setChartsReady(true);
  }, []);

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
      setMessage(error instanceof Error ? error.message : "Could not load dashboard");
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

  const breakdownChart = useMemo(() => {
    if (!passport) return [];
    return Object.entries(passport.verification_breakdown).map(([name, value]) => ({ name, value }));
  }, [passport]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !profileForm) return;
    setMessage("");
    try {
      await apiFetch<Profile>("/profile", {
        method: "PATCH",
        token,
        body: {
          ...profileForm,
          graduation_year: profileForm.graduation_year ? Number(profileForm.graduation_year) : null,
        },
      });
      setMessage("Profile saved.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save profile");
    }
  }

  async function submitEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setMessage("");
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
        await apiFetch(`/evidence/${claim.id}/files`, {
          method: "POST",
          token,
          body: formData,
        });
      }

      setEvidenceForm(emptyEvidence);
      setProofFile(null);
      setMessage("Evidence submitted for review.");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not submit evidence");
    }
  }

  async function exportPdf() {
    if (!token) return;
    try {
      const blob = await downloadPdf("/passport/export-pdf", token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `omniskill-${me?.profile?.username || "passport"}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not export PDF");
    }
  }

  function logout() {
    window.localStorage.removeItem("omniskill_token");
    router.push("/");
  }

  if (loading || !profileForm) {
    return <main className="app-bg flex min-h-screen items-center justify-center text-sm text-slate-600">Loading passport workspace...</main>;
  }

  return (
    <main className="app-bg min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase text-teal-700">Omni-Skill MVP</p>
            <h1 className="text-2xl font-semibold text-slate-950">Passport workspace</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {me?.user.role === "admin" ? (
              <Link className="btn-secondary" href="/admin">
                <ShieldCheck size={16} /> Admin queue
              </Link>
            ) : null}
            {me?.profile?.username ? (
              <Link className="btn-secondary" href={`/passport/${me.profile.username}`}>
                <ExternalLink size={16} /> Public passport
              </Link>
            ) : null}
            <button className="btn-secondary" type="button" onClick={logout}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="space-y-5">
          <form className="panel space-y-4" onSubmit={saveProfile}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Profile</p>
                <h2 className="section-title">Career identity</h2>
              </div>
              <button className="btn-primary" type="submit">
                <Save size={16} /> Save
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="label">
                Name
                <input className="input" value={profileForm.name} onChange={(event) => setProfileForm({ ...profileForm, name: event.target.value })} />
              </label>
              <label className="label">
                Username
                <input className="input" value={profileForm.username} onChange={(event) => setProfileForm({ ...profileForm, username: event.target.value })} />
              </label>
              <label className="label sm:col-span-2">
                Headline
                <input className="input" value={profileForm.headline} onChange={(event) => setProfileForm({ ...profileForm, headline: event.target.value })} />
              </label>
              <label className="label">
                College
                <input className="input" value={profileForm.college} onChange={(event) => setProfileForm({ ...profileForm, college: event.target.value })} />
              </label>
              <label className="label">
                Graduation year
                <input className="input" inputMode="numeric" value={profileForm.graduation_year} onChange={(event) => setProfileForm({ ...profileForm, graduation_year: event.target.value })} />
              </label>
              <label className="label">
                Role identity
                <input className="input" value={profileForm.role_identity} onChange={(event) => setProfileForm({ ...profileForm, role_identity: event.target.value })} />
              </label>
              <label className="label-row">
                <input
                  type="checkbox"
                  checked={profileForm.visibility_public}
                  onChange={(event) => setProfileForm({ ...profileForm, visibility_public: event.target.checked })}
                />
                Public passport
              </label>
              <label className="label sm:col-span-2">
                Bio
                <textarea className="textarea" rows={3} value={profileForm.bio} onChange={(event) => setProfileForm({ ...profileForm, bio: event.target.value })} />
              </label>
            </div>
          </form>

          <form className="panel space-y-4" onSubmit={submitEvidence}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Evidence</p>
                <h2 className="section-title">Submit a claim</h2>
              </div>
              <button className="btn-primary" type="submit">
                <Send size={16} /> Submit
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="label">
                Claim type
                <select className="input" value={evidenceForm.kind} onChange={(event) => setEvidenceForm({ ...evidenceForm, kind: event.target.value as EvidenceKind })}>
                  {Object.entries(evidenceLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="label">
                Source platform
                <input className="input" value={evidenceForm.source_platform} onChange={(event) => setEvidenceForm({ ...evidenceForm, source_platform: event.target.value })} />
              </label>
              <label className="label sm:col-span-2">
                Title
                <input required className="input" value={evidenceForm.title} onChange={(event) => setEvidenceForm({ ...evidenceForm, title: event.target.value })} />
              </label>
              <label className="label">
                Organization
                <input className="input" value={evidenceForm.organization} onChange={(event) => setEvidenceForm({ ...evidenceForm, organization: event.target.value })} />
              </label>
              <label className="label">
                Role
                <input className="input" value={evidenceForm.role} onChange={(event) => setEvidenceForm({ ...evidenceForm, role: event.target.value })} />
              </label>
              <label className="label">
                Start date
                <input className="input" type="date" value={evidenceForm.start_date} onChange={(event) => setEvidenceForm({ ...evidenceForm, start_date: event.target.value })} />
              </label>
              <label className="label">
                End date
                <input className="input" type="date" value={evidenceForm.end_date} onChange={(event) => setEvidenceForm({ ...evidenceForm, end_date: event.target.value })} />
              </label>
              <label className="label">
                Community size
                <input className="input" inputMode="numeric" value={evidenceForm.community_size} onChange={(event) => setEvidenceForm({ ...evidenceForm, community_size: event.target.value })} />
              </label>
              <label className="label">
                Proof file
                <input className="file-input" type="file" onChange={(event: ChangeEvent<HTMLInputElement>) => setProofFile(event.target.files?.[0] || null)} />
              </label>
              <label className="label sm:col-span-2">
                Responsibilities
                <textarea className="textarea" rows={3} value={evidenceForm.responsibilities} onChange={(event) => setEvidenceForm({ ...evidenceForm, responsibilities: event.target.value })} />
              </label>
              <label className="label sm:col-span-2">
                Outcomes
                <textarea className="textarea" rows={3} value={evidenceForm.outcomes} onChange={(event) => setEvidenceForm({ ...evidenceForm, outcomes: event.target.value })} />
              </label>
              <label className="label sm:col-span-2">
                Proof notes
                <textarea className="textarea" rows={2} value={evidenceForm.proof_notes} onChange={(event) => setEvidenceForm({ ...evidenceForm, proof_notes: event.target.value })} />
              </label>
            </div>
          </form>
        </section>

        <section className="space-y-5">
          {message ? <div className="notice">{message}</div> : null}

          <div className="panel space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="eyebrow">Passport</p>
                <h2 className="section-title">Verified output</h2>
              </div>
              <button className="btn-primary" type="button" onClick={exportPdf} disabled={!passport}>
                <Download size={16} /> PDF
              </button>
            </div>

            {passport ? (
              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <p className="text-sm text-slate-600">{passport.career_summary}</p>
                </div>
                <div className="h-56 rounded-lg border border-slate-200 p-3">
                  {breakdownChart.length && chartsReady ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={220}>
                      <BarChart data={breakdownChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-500">Approved evidence appears here.</div>
                  )}
                </div>
                <div className="grid gap-3">
                  {passport.skill_cards.map((card) => (
                    <article className="rounded-lg border border-slate-200 p-4" key={card.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-950">{card.signal_name}</h3>
                        <span className="chip">
                          <BadgeCheck size={14} /> Level {card.verification_level}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{card.career_translation}</p>
                      <p className="mt-2 text-xs text-slate-500">{card.limitations}</p>
                    </article>
                  ))}
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="mb-3 font-semibold text-slate-950">Resume bullets</h3>
                  <div className="space-y-2">
                    {passport.resume_bullets.map((bullet) => (
                      <p className="text-sm text-slate-700" key={bullet.id}>
                        {bullet.bullet}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-slate-300 text-center text-sm text-slate-500">
                Save your profile and get one claim approved to publish the first passport cards.
              </div>
            )}
          </div>

          <div className="panel space-y-4">
            <div className="flex items-center gap-2">
              <Activity className="text-teal-700" size={18} />
              <h2 className="section-title">Evidence timeline</h2>
            </div>
            <div className="space-y-3">
              {claims.length ? (
                claims.map((claim) => (
                  <article className="rounded-lg border border-slate-200 p-4" key={claim.id}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-slate-950">{claim.title}</h3>
                        <p className="text-xs text-slate-500">{evidenceLabels[claim.kind]} - {claim.source_platform || "Manual proof"}</p>
                      </div>
                      <span className={`status status-${claim.status}`}>{claim.status.replaceAll("_", " ")}</span>
                    </div>
                    {claim.reviewer_notes ? <p className="mt-2 text-sm text-slate-600">{claim.reviewer_notes}</p> : null}
                  </article>
                ))
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-300 p-4 text-sm text-slate-500">
                  <FilePlus2 size={16} /> No evidence claims yet.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
