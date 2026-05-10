export type VerificationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "needs_more_info"
  | "approved"
  | "rejected"
  | "revoked";

export type EvidenceKind =
  | "discord_admin"
  | "esports_player"
  | "tournament_organizer"
  | "club_member"
  | "guild_leader";

export type VerificationLevel = 1 | 2 | 3 | 4 | 5;

