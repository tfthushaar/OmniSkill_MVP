from textwrap import wrap


def _escape_pdf_text(text: str) -> str:
    safe = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")
    return safe.encode("latin-1", "replace").decode("latin-1")


def _pdf_lines(passport: dict) -> list[str]:
    profile = passport["profile"]
    lines = [
        "Omni-Skill Passport",
        profile.name or profile.username,
        profile.headline or profile.role_identity or "Verified digital experience profile",
        "",
        "Career Summary",
    ]
    lines.extend(wrap(passport["career_summary"], width=86) or ["No summary yet."])
    lines.extend(["", "Evidence Cards"])
    for card in passport["skill_cards"][:8]:
        lines.append(f"- {card.signal_name} | Level {card.verification_level} | {round(card.confidence * 100)}% confidence")
        lines.extend(wrap(card.career_translation, width=86))
        if card.limitations:
            lines.extend(wrap(f"Limitations: {card.limitations}", width=86))
    lines.extend(["", "Resume Bullets"])
    for bullet in passport["resume_bullets"][:8]:
        lines.extend(wrap(f"- {bullet.bullet}", width=86))
    return lines[:58]


def build_passport_pdf(passport: dict) -> bytes:
    content_lines = ["BT", "/F1 11 Tf", "14 TL", "72 760 Td"]
    for line in _pdf_lines(passport):
        content_lines.append(f"({_escape_pdf_text(line)}) Tj")
        content_lines.append("T*")
    content_lines.append("ET")
    stream = "\n".join(content_lines).encode("latin-1")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
    ]

    pdf = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(pdf))
        pdf.extend(f"{index} 0 obj\n".encode("ascii"))
        pdf.extend(obj)
        pdf.extend(b"\nendobj\n")

    xref_offset = len(pdf)
    pdf.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    pdf.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        pdf.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    pdf.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(pdf)

