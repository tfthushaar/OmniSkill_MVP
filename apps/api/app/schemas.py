from datetime import date, datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import EvidenceKind, UserRole, VerificationStatus


class ApiModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    admin_invite_code: str = ""


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserRead(ApiModel):
    id: int
    email: EmailStr
    role: UserRole
    created_at: datetime


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class ProfileUpsert(BaseModel):
    name: str = ""
    username: str = Field(default="", pattern=r"^[a-zA-Z0-9_-]{3,32}$")
    headline: str = ""
    college: str = ""
    graduation_year: Optional[int] = None
    bio: str = ""
    role_identity: str = ""
    visibility_public: bool = True


class ProfileRead(ApiModel):
    id: int
    user_id: int
    name: str
    username: str
    headline: str
    college: str
    graduation_year: Optional[int]
    bio: str
    role_identity: str
    visibility_public: bool
    created_at: datetime
    updated_at: datetime


class MeResponse(BaseModel):
    user: UserRead
    profile: Optional[ProfileRead] = None


class EvidenceCreate(BaseModel):
    kind: EvidenceKind
    title: str = Field(min_length=3, max_length=140)
    organization: str = ""
    source_platform: str = ""
    role: str = ""
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    community_size: Optional[int] = Field(default=None, ge=0)
    responsibilities: str = ""
    outcomes: str = ""
    proof_notes: str = ""


class EvidenceRead(ApiModel):
    id: int
    user_id: int
    kind: EvidenceKind
    title: str
    organization: str
    source_platform: str
    role: str
    start_date: Optional[date]
    end_date: Optional[date]
    community_size: Optional[int]
    responsibilities: str
    outcomes: str
    proof_notes: str
    status: VerificationStatus
    verification_level: int
    confidence: float
    reviewer_notes: str
    limitations: str
    submitted_at: datetime
    reviewed_at: Optional[datetime]
    updated_at: datetime


class EvidenceFileRead(ApiModel):
    id: int
    evidence_claim_id: int
    file_name: str
    content_type: str
    storage_path: str
    uploaded_at: datetime


class EvidenceDetail(EvidenceRead):
    files: list[EvidenceFileRead] = []


class ReviewRequest(BaseModel):
    verification_level: int = Field(default=3, ge=1, le=5)
    notes: str = ""


class SkillCardRead(ApiModel):
    id: int
    evidence_claim_id: int
    signal_name: str
    source: str
    verification_level: int
    confidence: float
    career_translation: str
    limitations: str
    supporting_facts: list[str]
    created_at: datetime


class ResumeBulletRead(ApiModel):
    id: int
    evidence_claim_id: int
    bullet: str
    created_at: datetime


class PassportResponse(BaseModel):
    profile: ProfileRead
    evidence: list[EvidenceRead]
    skill_cards: list[SkillCardRead]
    resume_bullets: list[ResumeBulletRead]
    verification_breakdown: dict[str, int]
    career_summary: str


class UploadUrlResponse(BaseModel):
    upload_url: str
    method: str = "POST"
    field_name: str = "file"
    note: str


class ConnectedAccountCreate(BaseModel):
    provider_account_id: str = ""
    display_name: str = ""
    scopes: list[str] = []


class ConnectedAccountRead(ApiModel):
    id: int
    user_id: int
    provider: str
    provider_account_id: str
    display_name: str
    scopes: list[str]
    connected_at: datetime
    last_synced_at: Optional[datetime]


class SyncJobRead(ApiModel):
    id: int
    provider: str
    status: str
    error_message: str
    created_at: datetime
    updated_at: datetime


class HealthResponse(BaseModel):
    status: str
    service: str

