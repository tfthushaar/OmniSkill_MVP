from datetime import date, datetime, timezone
from enum import Enum
from typing import Any, Optional

from sqlalchemy import Column, JSON, UniqueConstraint
from sqlmodel import Field, SQLModel


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserRole(str, Enum):
    member = "member"
    admin = "admin"


class EvidenceKind(str, Enum):
    discord_admin = "discord_admin"
    esports_player = "esports_player"
    tournament_organizer = "tournament_organizer"
    club_member = "club_member"
    guild_leader = "guild_leader"


class VerificationStatus(str, Enum):
    draft = "draft"
    submitted = "submitted"
    under_review = "under_review"
    needs_more_info = "needs_more_info"
    approved = "approved"
    rejected = "rejected"
    revoked = "revoked"


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: UserRole = Field(default=UserRole.member)
    created_at: datetime = Field(default_factory=utc_now)


class Profile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id", unique=True)
    name: str = ""
    username: str = Field(default="", index=True, unique=True)
    headline: str = ""
    college: str = ""
    graduation_year: Optional[int] = None
    bio: str = ""
    role_identity: str = ""
    visibility_public: bool = True
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class ConnectedAccount(SQLModel, table=True):
    __table_args__ = (UniqueConstraint("user_id", "provider", name="uq_user_provider"),)

    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    provider: str = Field(index=True)
    provider_account_id: str = ""
    display_name: str = ""
    scopes: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    token_reference: str = ""
    connected_at: datetime = Field(default_factory=utc_now)
    last_synced_at: Optional[datetime] = None


class RawDataSnapshot(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    provider: str = Field(index=True)
    external_id: str = ""
    snapshot: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    captured_at: datetime = Field(default_factory=utc_now)


class NormalizedActivity(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    source_provider: str = Field(index=True)
    activity_type: str = Field(index=True)
    occurred_at: Optional[datetime] = None
    title: str = ""
    metrics: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    source_snapshot_id: Optional[int] = Field(default=None, foreign_key="rawdatasnapshot.id")


class DerivedMetric(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    metric_name: str = Field(index=True)
    metric_value: float = 0
    window_start: Optional[date] = None
    window_end: Optional[date] = None
    source_detail: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    calculated_at: datetime = Field(default_factory=utc_now)


class CareerSignal(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    signal_name: str = Field(index=True)
    confidence: float = 0
    verification_level: int = 1
    evidence_window: str = ""
    supporting_data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    limitations: str = ""
    created_at: datetime = Field(default_factory=utc_now)


class EvidenceClaim(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    kind: EvidenceKind = Field(index=True)
    title: str
    organization: str = ""
    source_platform: str = ""
    role: str = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    community_size: Optional[int] = None
    responsibilities: str = ""
    outcomes: str = ""
    proof_notes: str = ""
    status: VerificationStatus = Field(default=VerificationStatus.submitted, index=True)
    verification_level: int = 1
    confidence: float = 0.35
    reviewer_notes: str = ""
    limitations: str = "Self-reported until verified by an admin, peer, community, or institution."
    submitted_at: datetime = Field(default_factory=utc_now)
    reviewed_at: Optional[datetime] = None
    updated_at: datetime = Field(default_factory=utc_now)


class EvidenceFile(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    evidence_claim_id: int = Field(index=True, foreign_key="evidenceclaim.id")
    user_id: int = Field(index=True, foreign_key="user.id")
    file_name: str
    content_type: str = ""
    storage_path: str
    uploaded_at: datetime = Field(default_factory=utc_now)


class SkillCard(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    evidence_claim_id: int = Field(index=True, foreign_key="evidenceclaim.id")
    signal_name: str
    source: str = ""
    verification_level: int = 1
    confidence: float = 0.35
    career_translation: str
    limitations: str
    supporting_facts: list[str] = Field(default_factory=list, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=utc_now)


class ResumeBullet(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    evidence_claim_id: int = Field(index=True, foreign_key="evidenceclaim.id")
    bullet: str
    created_at: datetime = Field(default_factory=utc_now)


class VerificationReview(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    evidence_claim_id: int = Field(index=True, foreign_key="evidenceclaim.id")
    reviewer_id: int = Field(index=True, foreign_key="user.id")
    decision: VerificationStatus = Field(index=True)
    verification_level: int = 1
    notes: str = ""
    created_at: datetime = Field(default_factory=utc_now)


class DataSyncJob(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(index=True, foreign_key="user.id")
    provider: str = Field(index=True)
    status: str = Field(default="queued", index=True)
    error_message: str = ""
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class AuditLog(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    actor_user_id: Optional[int] = Field(default=None, index=True, foreign_key="user.id")
    action: str = Field(index=True)
    target_type: str = ""
    target_id: Optional[int] = None
    event_data: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=utc_now)
