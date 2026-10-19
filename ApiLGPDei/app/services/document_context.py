"""Build per-turn document context: full text for small docs, PageIndex retrieve for large ones."""

from __future__ import annotations

import logging

from app.config import settings
from app.models import SessionDocument
from app.services.pageindex_service import retrieve_from_tree

logger = logging.getLogger(__name__)


def build_document_contexts(
    documents: list[SessionDocument],
    query: str,
) -> list[dict]:
    contexts: list[dict] = []
    budget = settings.max_retrieved_chars

    for doc in documents:
        if budget <= 0:
            break

        mode = getattr(doc, "indexing_mode", "full") or "full"
        tree = getattr(doc, "page_index_tree", None)

        if mode == "pageindex" and tree:
            try:
                excerpts = retrieve_from_tree(
                    tree,
                    query,
                    max_chars=min(budget, settings.max_retrieved_chars // 2 or budget),
                )
                if excerpts:
                    text = "\n\n".join(
                        f"### {item['title']}\n{item['content']}" for item in excerpts
                    )
                    contexts.append(
                        {
                            "file_name": doc.file_name,
                            "extracted_text": text,
                            "indexing_mode": "pageindex",
                        }
                    )
                    budget -= len(text)
                    continue
            except Exception:
                logger.exception("PageIndex retrieve failed for %s; falling back", doc.file_name)

        text = doc.extracted_text
        if len(text) > budget:
            text = text[:budget].rstrip() + "…"
        contexts.append(
            {
                "file_name": doc.file_name,
                "extracted_text": text,
                "indexing_mode": "full",
            }
        )
        budget -= len(text)

    return contexts
