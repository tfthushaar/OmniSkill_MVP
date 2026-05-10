from sqlmodel import Session, select

from app.models import (
    EvidenceClaim,
    EvidenceKind,
    Profile,
    ResumeBullet,
    SkillCard,
    VerificationStatus,
)

SIGNAL_MAP = {
    EvidenceKind.discord_admin: "Community Operations",
    EvidenceKind.esports_player: "Competitive Discipline",
    EvidenceKind.tournament_organizer: "Event Coordination",
    EvidenceKind.club_member: "Campus Esports Participation",
    EvidenceKind.guild_leader: "Digital Team Leadership",
}


def confidence_for_level(level: int) -> float:
    return min(0.95, 0.25 + (level * 0.13))


def verification_label(level: int) -> str:
    labels = {
        1: "self_reported",
        2: "account_linked",
        3: "platform_data_verified",
        4: "peer_or_community_verified",
        5: "institution_verified",
    }
    return labels.get(level, "unknown")


def _fact_list(claim: EvidenceClaim) -> list[str]:
    facts = [claim.title]
    if claim.organization:
        facts.append(f"Organization: {claim.organization}")
    if claim.role:
        facts.append(f"Role: {claim.role}")
    if claim.source_platform:
        facts.append(f"Source: {claim.source_platform}")
    if claim.community_size:
        facts.append(f"Community size: {claim.community_size}")
    if claim.start_date:
        window = claim.start_date.isoformat()
        if claim.end_date:
            window = f"{window} to {claim.end_date.isoformat()}"
        facts.append(f"Evidence window: {window}")
    if claim.outcomes:
        facts.append(f"Outcome: {claim.outcomes}")
    return facts


def build_skill_card(claim: EvidenceClaim) -> SkillCard:
    signal = SIGNAL_MAP.get(claim.kind, "Verified Digital Experience")
    confidence = confidence_for_level(claim.verification_level)
    source = claim.source_platform or claim.organization or "Manual proof"
    translation = {
        EvidenceKind.discord_admin: "Shows structured community operations experience through moderation, member support, role management, and community maintenance evidence.",
        EvidenceKind.esports_player: "Shows competitive participation evidence that can support discipline, practice consistency, and improvement narratives when backed by match or tournament proof.",
        EvidenceKind.tournament_organizer: "Shows event operations experience across planning, participant coordination, brackets, communication, and delivery outcomes.",
        EvidenceKind.club_member: "Shows sustained participation in a campus esports or gaming society with verifiable contributions to activities or events.",
        EvidenceKind.guild_leader: "Shows digital team coordination experience through recurring group management, planning, and role accountability evidence.",
    }[claim.kind]
    return SkillCard(
        user_id=claim.user_id,
        evidence_claim_id=claim.id or 0,
        signal_name=signal,
        source=source,
        verification_level=claim.verification_level,
        confidence=confidence,
        career_translation=translation,
        limitations=claim.limitations,
        supporting_facts=_fact_list(claim),
    )


def build_resume_bullet(claim: EvidenceClaim) -> ResumeBullet:
    action = {
        EvidenceKind.discord_admin: "Managed digital community operations",
        EvidenceKind.esports_player: "Maintained competitive esports participation",
        EvidenceKind.tournament_organizer: "Coordinated esports event operations",
        EvidenceKind.club_member: "Contributed to campus esports activities",
        EvidenceKind.guild_leader: "Led recurring digital team coordination",
    }[claim.kind]
    context = claim.organization or claim.source_platform or "a verified digital community"
    details = []
    if claim.community_size:
        details.append(f"supporting a community of {claim.community_size}+ members")
    if claim.outcomes:
        details.append(claim.outcomes.rstrip("."))
    if claim.responsibilities:
        details.append(claim.responsibilities.rstrip("."))
    suffix = f", {'; '.join(details)}" if details else ""
    return ResumeBullet(
        user_id=claim.user_id,
        evidence_claim_id=claim.id or 0,
        bullet=f"{action} for {context}{suffix}.",
    )


def career_summary(profile: Profile, cards: list[SkillCard]) -> str:
    name = profile.name or profile.username
    if not cards:
        return f"{name} is building an Omni-Skill Passport. Career signals will appear after evidence is verified."
    signals = ", ".join(card.signal_name for card in cards[:3])
    return f"{name} has verified evidence across {signals}. This summary is limited to approved evidence in the passport."


def passport_for_user(session: Session, user_id: int) -> dict:
    profile = session.exec(select(Profile).where(Profile.user_id == user_id)).first()
    if not profile:
        raise ValueError("Profile not found")
    evidence = session.exec(
        select(EvidenceClaim)
        .where(EvidenceClaim.user_id == user_id)
        .where(EvidenceClaim.status == VerificationStatus.approved)
        .order_by(EvidenceClaim.reviewed_at.desc())
    ).all()
    cards = session.exec(
        select(SkillCard).where(SkillCard.user_id == user_id).order_by(SkillCard.created_at.desc())
    ).all()
    bullets = session.exec(
        select(ResumeBullet).where(ResumeBullet.user_id == user_id).order_by(ResumeBullet.created_at.desc())
    ).all()
    breakdown: dict[str, int] = {}
    for claim in evidence:
        label = verification_label(claim.verification_level)
        breakdown[label] = breakdown.get(label, 0) + 1
    return {
        "profile": profile,
        "evidence": evidence,
        "skill_cards": cards,
        "resume_bullets": bullets,
        "verification_breakdown": breakdown,
        "career_summary": career_summary(profile, cards),
    }

