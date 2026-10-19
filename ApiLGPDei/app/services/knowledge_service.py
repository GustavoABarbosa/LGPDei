from __future__ import annotations

import json
from datetime import date, datetime
from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

from app.services.pageindex_service import build_tree_from_text, retrieve_from_tree, tree_outline

AppLocale = Literal["pt", "en"]

_MONTHS_PT = (
    "",
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
)

KNOWLEDGE_DIR = Path(__file__).resolve().parent.parent / "knowledge"
MANIFEST_PATH = KNOWLEDGE_DIR / "manifest.json"
LAW_PATH = KNOWLEDGE_DIR / "lei-13709-2018.md"
INDEX_PATH = KNOWLEDGE_DIR / "lei-13709.pageindex.json"


@lru_cache(maxsize=1)
def get_knowledge_manifest() -> dict[str, Any]:
    return json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))


def load_law_text() -> str:
    return LAW_PATH.read_text(encoding="utf-8")


def build_corpus_tree() -> dict[str, Any]:
    return build_tree_from_text(load_law_text(), root_title="LGPD — Lei 13.709/2018")


def save_corpus_index(tree: dict[str, Any] | None = None) -> dict[str, Any]:
    tree = tree or build_corpus_tree()
    INDEX_PATH.write_text(json.dumps(tree, ensure_ascii=False), encoding="utf-8")
    get_corpus_tree.cache_clear()
    return tree


@lru_cache(maxsize=1)
def get_corpus_tree() -> dict[str, Any]:
    if INDEX_PATH.exists():
        return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
    return save_corpus_index()


def warm_corpus_index() -> None:
    get_knowledge_manifest.cache_clear()
    get_corpus_tree.cache_clear()
    get_corpus_tree()


def corpus_outline(limit: int = 65) -> str:
    return tree_outline(get_corpus_tree(), limit=limit)


def retrieve_corpus_excerpts(query: str, *, max_chars: int) -> list[dict[str, str]]:
    return retrieve_from_tree(get_corpus_tree(), query, max_chars=max_chars)


def parse_knowledge_updated_at() -> date:
    raw = str(get_knowledge_manifest().get("updated_at", ""))
    try:
        return date.fromisoformat(raw[:10])
    except ValueError:
        return date.today()


def format_knowledge_updated_at(locale: AppLocale = "pt") -> str:
    value = parse_knowledge_updated_at()
    if locale == "en":
        return value.strftime("%d %B %Y")
    return f"{value.day} de {_MONTHS_PT[value.month]} de {value.year}"


def knowledge_freshness_notice(locale: AppLocale = "pt") -> str:
    stamped = format_knowledge_updated_at(locale)
    if locale == "en":
        return (
            f"The assistant's legal knowledge base is current as of {stamped}; "
            "changes after that date may not be reflected in answers."
        )
    return (
        f"A base normativa deste assistente está atualizada até {stamped}; "
        "alterações posteriores a essa data podem não estar refletidas nas respostas."
    )


def knowledge_system_metadata() -> str:
    manifest = get_knowledge_manifest()
    sources = ", ".join(s["name"] for s in manifest.get("sources", []))
    return (
        f"Knowledge version: {manifest['version']} "
        f"(updated {manifest['updated_at']}). Sources: {sources}. "
        f"{knowledge_freshness_notice('en')}"
    )
