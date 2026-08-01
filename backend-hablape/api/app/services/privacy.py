from __future__ import annotations

import re

from app.schemas import PrivacyNotice


_PATTERNS: tuple[tuple[str, re.Pattern[str]], ...] = (
    ("posible_dni", re.compile(r"(?<!\d)\d{8}(?!\d)")),
    (
        "posible_correo",
        re.compile(r"\b[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}\b"),
    ),
    (
        "posible_telefono",
        re.compile(r"(?<!\d)(?:\+?51[\s-]?)?9\d{8}(?!\d)"),
    ),
)


def inspect_personal_data(text: str) -> PrivacyNotice:
    matches = [
        label for label, pattern in _PATTERNS if pattern.search(text)
    ]
    return PrivacyNotice(possible_personal_data=matches)


def safe_text_fingerprint(text: str) -> str:
    """Returns only coarse metadata; never the text or a reversible hash."""
    word_count = len(text.split())
    if word_count < 10:
        return "short"
    if word_count < 40:
        return "medium"
    return "long"

