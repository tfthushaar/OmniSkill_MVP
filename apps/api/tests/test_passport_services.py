from datetime import date

from app.models import EvidenceClaim, EvidenceKind
from app.services.passport import build_resume_bullet, build_skill_card, confidence_for_level


def test_confidence_for_level_is_bounded() -> None:
    assert confidence_for_level(1) < confidence_for_level(5)
    assert confidence_for_level(20) == 0.95


def test_skill_card_and_bullet_use_submitted_facts() -> None:
    claim = EvidenceClaim(
        id=42,
        user_id=1,
        kind=EvidenceKind.discord_admin,
        title="Moderated Valorant society Discord",
        organization="North Campus Esports",
        source_platform="Discord",
        role="Moderator",
        start_date=date(2025, 1, 1),
        community_size=750,
        responsibilities="Handled onboarding, role hygiene, and event announcements",
        outcomes="Reduced duplicate support requests during tournament weeks",
        verification_level=4,
    )

    card = build_skill_card(claim)
    bullet = build_resume_bullet(claim)

    assert card.signal_name == "Community Operations"
    assert card.verification_level == 4
    assert "750" in " ".join(card.supporting_facts)
    assert "North Campus Esports" in bullet.bullet
    assert "Reduced duplicate support requests" in bullet.bullet

