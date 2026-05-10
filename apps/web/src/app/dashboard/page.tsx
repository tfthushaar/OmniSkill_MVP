"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BadgeCheck, Check, ChevronRight, ClipboardCopy, Download, ExternalLink, FilePlus2, LogOut, Send, ShieldCheck } from "lucide-react";
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

type ProfileForm = {
  name: string; username: string; headline: string; college: string;
  graduation_year: string; bio: string; role_identity: string; visibility_public: boolean;
};

type EvidenceForm = {
  kind: EvidenceKind; title: string; organization: string; source_platform: string;
  role: string; start_date: string; end_date: string; community_size: string;
  responsibilities: string; outcomes: string; proof_notes: string;
};

const emptyEvidence: EvidenceForm = {
  kind: "discord_admin", title: "", organization: "", source_platform: "Discord",
  role: "", start_date: "", end_date: "", community_size: "",
  responsibilities: "", outcomes: "", proof_notes: "",
};

function profileToForm(p: Profile | null, email: string): ProfileForm {
  const fallback = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);
  return {
    name: p?.name || "", username: p?.username || fallback || "player001",
    headline: p?.headline || "Digital community and esports operator", college: p?.college || "",
    graduation_year: p?.graduation_year ? String(p.graduation_year) : "", bio: p?.bio || "",
    role_identity: p?.role_identity || "Community operator", visibility_public: p?.visibility_public ?? true,
  };
}

/* ── Mono label ── */
const ML = ({ children }: { children: React.ReactNode }) => (
  <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "2px", textTransform: "uppercase" as const }}>
    {children}
  </span>
);

/* ── Copy bullet ── */
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

/* ── Signal bar ── */
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

/* ── Career tracks ── */
function CareerTracks({ tracks }: { tracks: CareerTrack[] }) {
  const strong = tracks.filter((t) => t.fit === "strong");
  const moderate = tracks.filter((t) => t.fit === "moderate");
  if (!tracks.length) return null;
  return (
    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <p className="eyebrow">Career track suggestions</p>
      {strong.length > 0 && (
        <div>
          <ML>Strong fit</ML>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
            {strong.map((t) => (
              <div key={t.track} className="track-strong" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--accent)" }}>▶</span>
                <span style={{ fontSize: "14px", color: "var(--text-bright)", fontFamily: "var(--font-body, sans-serif)", fontWeight: 600 }}>{t.track}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {moderate.length > 0 && (
        <div>
          <ML>Moderate fit</ML>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
            {moderate.map((t) => (
              <div key={t.track} className="track-moderate" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--accent3)" }}>▷</span>
                <span style={{ fontSize: "14px", color: "var(--text)", fontFamily: "var(--font-body, sans-serif)" }}>{t.track}</span>
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
  const [msg, setMsg] = useState({ text: "", kind: "notice" as "notice" | "notice-success" | "notice-error" });
  const [loading, setLoading] = useState(true);
  const [chartsReady, setChartsReady] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");

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
      try { setPassport(await apiFetch<Passport>("/passport/me", { token })); }
      catch { setPassport(null); }
    } catch (err) {
      setMsg({ text: err instanceof Error ? err.message : "Could not load dashboard", kind: "notice-error" });
    } finally { setLoading(false); }
  }, [token]);

  useEffect(() => {
    const saved = window.localStorage.getItem("omniskill_token");
    if (!saved) { router.push("/"); return; }
    setToken(saved);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  const breakdownChart = useMemo(() => {
    if (!passport) return [];
    return Object.entries(passport.verification_breakdown).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
  }, [passport]);

  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const pendingCount = claims.filter((c) => ["submitted", "under_review"].includes(c.status)).length;

  async function saveProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token || !profileForm) return;
    setMsg({ text: "", kind: "notice" });
    try {
      await apiFetch<Profile>("/profile", { method: "PATCH", token, body: { ...profileForm, graduation_year: profileForm.graduation_year ? Number(profileForm.graduation_year) : null } });
      setMsg({ text: "Profile saved.", kind: "notice-success" });
      await load();
    } catch (err) { setMsg({ text: err instanceof Error ? err.message : "Could not save profile", kind: "notice-error" }); }
  }

  async function submitEvidence(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    setMsg({ text: "", kind: "notice" });
    try {
      const claim = await apiFetch<EvidenceClaim>("/evidence", {
        method: "POST", token,
        body: { ...evidenceForm, start_date: evidenceForm.start_date || null, end_date: evidenceForm.end_date || null, community_size: evidenceForm.community_size ? Number(evidenceForm.community_size) : null },
      });
      if (proofFile) {
        const fd = new FormData(); fd.set("file", proofFile);
        await apiFetch(`/evidence/${claim.id}/files`, { method: "POST", token, body: fd });
      }
      setEvidenceForm(emptyEvidence);
      setProofFile(null);
      setMsg({ text: "Evidence submitted for admin review.", kind: "notice-success" });
      await load();
      setTab("evidence");
    } catch (err) { setMsg({ text: err instanceof Error ? err.message : "Could not submit evidence", kind: "notice-error" }); }
  }

  async function exportPdf() {
    if (!token) return;
    try {
      const blob = await downloadPdf("/passport/export-pdf", token);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `omniskill-${me?.profile?.username || "passport"}.pdf`; a.click();
      URL.revokeObjectURL(url);
    } catch (err) { setMsg({ text: err instanceof Error ? err.message : "Could not export PDF", kind: "notice-error" }); }
  }

  function logout() { window.localStorage.removeItem("omniskill_token"); router.push("/"); }

  if (loading || !profileForm) {
    return (
      <main className="app-bg" style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "13px", color: "var(--accent)", letterSpacing: "3px", textTransform: "uppercase" }}>
          // Loading passport workspace...
        </p>
      </main>
    );
  }

  return (
    <main className="app-bg min-h-screen">

      {/* ─── HEADER ─── */}
      <header style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(5,10,15,0.95)", borderBottom: "1px solid var(--border)", backdropFilter: "blur(12px)" }}>
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: "56px", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span className="logo-text" style={{ fontSize: "16px" }}>OMNI<span className="logo-dash">-</span>SKILL</span>
            <span style={{ color: "var(--border)" }}>|</span>
            <ML>Career Graph</ML>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {approvedCount > 0 && <span className="chip chip-green">{approvedCount} verified</span>}
            {pendingCount > 0 && <span className="chip chip-orange">{pendingCount} pending</span>}
            {me?.user.role === "admin" && (
              <Link href="/admin" className="btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
                <ShieldCheck size={13} /> Admin
              </Link>
            )}
            {me?.profile?.username && (
              <Link href={`/passport/${me.profile.username}`} target="_blank" className="btn-secondary" style={{ fontSize: "11px", padding: "6px 14px" }}>
                <ExternalLink size={13} /> Passport
              </Link>
            )}
            <button className="btn-ghost" type="button" onClick={logout} style={{ fontSize: "11px" }}>
              <LogOut size={13} /> Sign out
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "0 32px" }}>
          <div className="tab-bar">
            {([
              { id: "profile" as Tab, label: "// Profile" },
              { id: "evidence" as Tab, label: `// Evidence${claims.length ? ` (${claims.length})` : ""}` },
              { id: "passport" as Tab, label: `// Passport${passport?.skill_cards.length ? ` (${passport.skill_cards.length})` : ""}` },
            ]).map(({ id, label }) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`tab-btn ${tab === id ? "tab-btn-active" : ""}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" }}>
        {msg.text && <div className={`${msg.kind} flex items-center gap-2`} style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>{msg.text}</div>}

        {/* ══════════════ PROFILE TAB ══════════════ */}
        {tab === "profile" && profileForm && (
          <div style={{ maxWidth: "700px" }}>
            <form onSubmit={saveProfile} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: "4px" }}>Career identity</p>
                  <h2 className="section-title">Your profile</h2>
                </div>
                <button className="btn-primary" type="submit">Save profile</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--border)", padding: "2px" }}>
                {[
                  { lbl: "Full name", key: "name", placeholder: "Alex Chen", span: 1 },
                  { lbl: "Username", key: "username", placeholder: "alexchen99", span: 1 },
                  { lbl: "Headline", key: "headline", placeholder: "Esports captain & Discord community operator", span: 2 },
                  { lbl: "College / University", key: "college", placeholder: "VIT University", span: 1 },
                  { lbl: "Graduation year", key: "graduation_year", placeholder: "2026", span: 1 },
                  { lbl: "Role identity", key: "role_identity", placeholder: "Community operator & Esports coordinator", span: 2 },
                ].map(({ lbl, key, placeholder, span }) => (
                  <label key={key} className="label panel" style={{ gridColumn: span === 2 ? "1 / -1" : undefined }}>
                    {lbl}
                    <input
                      className="input"
                      placeholder={placeholder}
                      value={(profileForm as Record<string, string>)[key] || ""}
                      onChange={(e) => setProfileForm({ ...profileForm, [key]: e.target.value })}
                    />
                  </label>
                ))}
                <label className="label-row panel" style={{ gridColumn: "1 / -1" }}>
                  <input type="checkbox" checked={profileForm.visibility_public} onChange={(e) => setProfileForm({ ...profileForm, visibility_public: e.target.checked })} />
                  Make passport publicly shareable
                </label>
                <label className="label panel" style={{ gridColumn: "1 / -1" }}>
                  Bio
                  <textarea
                    className="textarea"
                    rows={4}
                    placeholder="Describe your gaming background, community work, and career goals..."
                    value={profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  />
                </label>
              </div>

              {me?.profile?.username && (
                <div className="panel panel-accent" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                  <div>
                    <ML>Your public passport URL</ML>
                    <p style={{ color: "var(--accent)", fontFamily: "var(--font-mono, monospace)", fontSize: "13px", marginTop: "4px" }}>
                      /passport/{me.profile.username}
                    </p>
                  </div>
                  <Link href={`/passport/${me.profile.username}`} target="_blank" className="btn-secondary" style={{ fontSize: "11px" }}>
                    <ExternalLink size={13} /> Open
                  </Link>
                </div>
              )}
            </form>
          </div>
        )}

        {/* ══════════════ EVIDENCE TAB ══════════════ */}
        {tab === "evidence" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {/* Submit form */}
            <form onSubmit={submitEvidence} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
                <div>
                  <p className="eyebrow" style={{ marginBottom: "4px" }}>New claim</p>
                  <h2 className="section-title">Submit evidence</h2>
                </div>
                <button className="btn-primary" type="submit"><Send size={13} /> Submit</button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px", background: "var(--border)" }}>
                <label className="label panel">
                  Evidence type
                  <select className="input" value={evidenceForm.kind} onChange={(e) => {
                    const kind = e.target.value as EvidenceKind;
                    const map: Partial<Record<EvidenceKind, string>> = { discord_admin: "Discord", esports_player: "FACEIT", tournament_organizer: "Manual proof", club_member: "College", guild_leader: "Discord" };
                    setEvidenceForm({ ...evidenceForm, kind, source_platform: map[kind] || "" });
                  }}>
                    {Object.entries(evidenceLabels).map(([v, l]) => (
                      <option key={v} value={v}>{evidenceIcons[v as EvidenceKind]} {l}</option>
                    ))}
                  </select>
                </label>
                <label className="label panel">
                  Source platform
                  <input className="input" placeholder="Discord, FACEIT, Manual..." value={evidenceForm.source_platform} onChange={(e) => setEvidenceForm({ ...evidenceForm, source_platform: e.target.value })} />
                </label>
                <label className="label panel" style={{ gridColumn: "1 / -1" }}>
                  Title / Claim
                  <input required className="input" placeholder="e.g. Moderated 2,000+ member Discord server for 18 months" value={evidenceForm.title} onChange={(e) => setEvidenceForm({ ...evidenceForm, title: e.target.value })} />
                </label>
                <label className="label panel">
                  Organization
                  <input className="input" placeholder="Community name or team" value={evidenceForm.organization} onChange={(e) => setEvidenceForm({ ...evidenceForm, organization: e.target.value })} />
                </label>
                <label className="label panel">
                  Your role
                  <input className="input" placeholder="Head Moderator, Team Captain..." value={evidenceForm.role} onChange={(e) => setEvidenceForm({ ...evidenceForm, role: e.target.value })} />
                </label>
                <label className="label panel">
                  Start date
                  <input className="input" type="date" value={evidenceForm.start_date} onChange={(e) => setEvidenceForm({ ...evidenceForm, start_date: e.target.value })} />
                </label>
                <label className="label panel">
                  End date
                  <input className="input" type="date" value={evidenceForm.end_date} onChange={(e) => setEvidenceForm({ ...evidenceForm, end_date: e.target.value })} />
                </label>
                <label className="label panel">
                  Community size
                  <input className="input" inputMode="numeric" placeholder="2000" value={evidenceForm.community_size} onChange={(e) => setEvidenceForm({ ...evidenceForm, community_size: e.target.value })} />
                </label>
                <label className="label panel">
                  Proof file
                  <input className="file-input" type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setProofFile(e.target.files?.[0] || null)} />
                </label>
                <label className="label panel" style={{ gridColumn: "1 / -1" }}>
                  Responsibilities
                  <textarea className="textarea" rows={3} placeholder="What did you actually do in this role?" value={evidenceForm.responsibilities} onChange={(e) => setEvidenceForm({ ...evidenceForm, responsibilities: e.target.value })} />
                </label>
                <label className="label panel" style={{ gridColumn: "1 / -1" }}>
                  Outcomes
                  <textarea className="textarea" rows={2} placeholder="Measurable results: grew server by X%, organized Y events..." value={evidenceForm.outcomes} onChange={(e) => setEvidenceForm({ ...evidenceForm, outcomes: e.target.value })} />
                </label>
                <label className="label panel" style={{ gridColumn: "1 / -1" }}>
                  Proof notes
                  <textarea className="textarea" rows={2} placeholder="Describe what your uploaded proof shows..." value={evidenceForm.proof_notes} onChange={(e) => setEvidenceForm({ ...evidenceForm, proof_notes: e.target.value })} />
                </label>
              </div>
            </form>

            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "4px" }}>Evidence timeline</p>
                <h2 className="section-title">Your claims</h2>
              </div>
              {claims.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)" }}>
                  {claims.map((c) => (
                    <div key={c.id} className="panel" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <span style={{ fontSize: "20px", lineHeight: 1, marginTop: "2px" }}>{evidenceIcons[c.kind]}</span>
                          <div>
                            <p style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "16px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-bright)" }}>{c.title}</p>
                            <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "1px", marginTop: "2px" }}>
                              {evidenceLabels[c.kind]} · {c.source_platform || "Manual proof"}{c.organization ? ` · ${c.organization}` : ""}
                            </p>
                          </div>
                        </div>
                        <span className={`status status-${c.status}`} style={{ flexShrink: 0 }}>{c.status.replace(/_/g, " ")}</span>
                      </div>
                      {c.reviewer_notes && (
                        <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--text-dim)", borderLeft: "2px solid var(--accent)", paddingLeft: "10px" }}>
                          {c.reviewer_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", minHeight: "200px", textAlign: "center", border: "1px dashed var(--border)" }}>
                  <FilePlus2 size={24} style={{ color: "var(--text-dim)" }} />
                  <ML>No evidence claims yet</ML>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ PASSPORT TAB ══════════════ */}
        {tab === "passport" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Header */}
            <div className="panel panel-accent" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "16px" }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: "4px" }}>Verified output</p>
                <h2 className="section-title">Your Omni-Skill Passport</h2>
                {passport && <p style={{ color: "var(--text)", fontSize: "15px", marginTop: "8px", maxWidth: "600px" }}>{passport.career_summary}</p>}
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {me?.profile?.username && (
                  <Link href={`/passport/${me.profile.username}`} target="_blank" className="btn-secondary" style={{ fontSize: "11px" }}>
                    <ExternalLink size={13} /> Public view
                  </Link>
                )}
                <button className="btn-primary" type="button" onClick={exportPdf} disabled={!passport} style={{ fontSize: "11px" }}>
                  <Download size={13} /> Export PDF
                </button>
              </div>
            </div>

            {passport ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                {/* LEFT */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Signal strength */}
                  {passport.skill_cards.length > 0 && (
                    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <p className="eyebrow">Signal strength</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {passport.skill_cards.map((c) => <SignalBar key={c.id} label={c.signal_name} value={c.confidence} />)}
                      </div>
                    </div>
                  )}

                  {/* Breakdown chart */}
                  {breakdownChart.length > 0 && chartsReady && (
                    <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <p className="eyebrow">Verification breakdown</p>
                      <div style={{ height: "180px" }}>
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={160}>
                          <BarChart data={breakdownChart}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,45,66,0.8)" />
                            <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#4a6a80", fontFamily: "var(--font-mono, monospace)" }} axisLine={{ stroke: "#1a2d42" }} tickLine={false} />
                            <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: "#4a6a80", fontFamily: "var(--font-mono, monospace)" }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0b1622", border: "1px solid #00e5ff", borderRadius: 0, color: "#e8f4ff", fontSize: "11px", fontFamily: "var(--font-mono, monospace)" }} />
                            <Bar dataKey="value" fill="#00e5ff" radius={[0, 0, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* Career tracks */}
                  {passport.career_tracks && passport.career_tracks.length > 0 && <CareerTracks tracks={passport.career_tracks} />}
                </div>

                {/* RIGHT */}
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Evidence cards */}
                  <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <p className="eyebrow">Evidence cards</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)" }}>
                      {passport.skill_cards.map((c) => (
                        <div key={c.id} className="panel" style={{ position: "relative", overflow: "hidden" }}
                          onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}>
                          <div style={{ height: "2px", background: "linear-gradient(90deg, var(--accent), var(--accent3))", marginBottom: "12px" }} />
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                            <p style={{ fontFamily: "var(--font-head, Barlow Condensed, sans-serif)", fontSize: "17px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-bright)" }}>{c.signal_name}</p>
                            <span className="chip chip-green">Lv {c.verification_level}</span>
                          </div>
                          <p style={{ fontSize: "14px", color: "var(--text)", lineHeight: 1.6 }}>{c.career_translation}</p>
                          {c.limitations && <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "11px", color: "var(--accent2)", marginTop: "8px", letterSpacing: "0.5px" }}>⚠ {c.limitations}</p>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Resume bullets */}
                  <div className="panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <p className="eyebrow">Resume bullets</p>
                      <ML>Click to copy</ML>
                    </div>
                    {passport.resume_bullets.length ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px", background: "var(--border)" }}>
                        {passport.resume_bullets.map((b) => <CopyBullet key={b.id} text={b.bullet} />)}
                      </div>
                    ) : (
                      <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", color: "var(--text-dim)" }}>
                        // Appears after evidence is approved
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", minHeight: "280px", textAlign: "center", border: "1px dashed var(--border)" }}>
                <BadgeCheck size={36} style={{ color: "var(--text-dim)" }} />
                <div>
                  <p style={{ fontFamily: "var(--font-head, sans-serif)", fontSize: "20px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-bright)" }}>No passport generated yet</p>
                  <p style={{ fontFamily: "var(--font-mono, monospace)", fontSize: "12px", color: "var(--text-dim)", marginTop: "8px", maxWidth: "380px" }}>
                    // Save your profile and get at least one evidence claim approved
                  </p>
                </div>
                <button className="btn-secondary" type="button" onClick={() => setTab("evidence")} style={{ fontSize: "11px" }}>
                  <FilePlus2 size={13} /> Submit evidence
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
