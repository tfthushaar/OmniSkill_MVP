export type UserRole = "member" | "admin";

export type EvidenceKind =
  | "discord_admin"
  | "esports_player"
  | "tournament_organizer"
  | "club_member"
  | "guild_leader";

export type VerificationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_more_info"
  | "approved"
  | "rejected"
  | "revoked";

export type User = {
  id: number;
  email: string;
  role: UserRole;
  created_at: string;
};

export type Profile = {
  id: number;
  user_id: number;
  name: string;
  username: string;
  headline: string;
  college: string;
  graduation_year: number | null;
  bio: string;
  role_identity: string;
  visibility_public: boolean;
  created_at: string;
  updated_at: string;
};

export type EvidenceClaim = {
  id: number;
  user_id: number;
  kind: EvidenceKind;
  title: string;
  organization: string;
  source_platform: string;
  role: string;
  start_date: string | null;
  end_date: string | null;
  community_size: number | null;
  responsibilities: string;
  outcomes: string;
  proof_notes: string;
  status: VerificationStatus;
  verification_level: number;
  confidence: number;
  reviewer_notes: string;
  limitations: string;
  submitted_at: string;
  reviewed_at: string | null;
  updated_at: string;
};

export type SkillCard = {
  id: number;
  evidence_claim_id: number;
  signal_name: string;
  source: string;
  verification_level: number;
  confidence: number;
  career_translation: string;
  limitations: string;
  supporting_facts: string[];
  created_at: string;
};

export type ResumeBullet = {
  id: number;
  evidence_claim_id: number;
  bullet: string;
  created_at: string;
};

export type CareerTrack = {
  track: string;
  fit: "strong" | "moderate";
};

export type Passport = {
  profile: Profile;
  evidence: EvidenceClaim[];
  skill_cards: SkillCard[];
  resume_bullets: ResumeBullet[];
  verification_breakdown: Record<string, number>;
  career_summary: string;
  career_tracks: CareerTrack[];
};

export type MeResponse = {
  user: User;
  profile: Profile | null;
};

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

