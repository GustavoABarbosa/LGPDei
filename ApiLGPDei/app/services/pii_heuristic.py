import re

# Lightweight signals only — not a compliance guarantee.
_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("cpf", re.compile(r"\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b")),
    ("cnpj", re.compile(r"\b\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}\b")),
    ("email", re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I)),
    (
        "cartao",
        re.compile(r"\b(?:\d[ -]*?){13,19}\b"),
    ),
]


def detect_pii_signals(text: str) -> list[str]:
    found: list[str] = []
    for label, pattern in _PATTERNS:
        if pattern.search(text):
            found.append(label)
    return found
