"""PageIndex-style vectorless tree index: hierarchical nodes + relevance retrieve.

Uses document structure (markdown headings / Art. N) instead of embeddings.
Compatible with Anthropic-only deployments (no VectifyAI/OpenAI SDK required).
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal

IndexingMode = Literal["full", "pageindex"]

_HEADING_RE = re.compile(r"^(#{1,6})\s+(.+)$", re.M)
_ART_RE = re.compile(r"\bart\.?\s*(\d+)", re.I)
_WORD_RE = re.compile(r"[a-zà-ü0-9]{3,}", re.I)


@dataclass
class TreeNode:
    id: str
    title: str
    summary: str
    content: str
    children: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "summary": self.summary,
            "content": self.content,
            "children": self.children,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "TreeNode":
        return cls(
            id=data["id"],
            title=data["title"],
            summary=data.get("summary", ""),
            content=data.get("content", ""),
            children=list(data.get("children", [])),
        )


def _summary(text: str, limit: int = 220) -> str:
    compact = re.sub(r"\s+", " ", text).strip()
    if len(compact) <= limit:
        return compact
    return compact[: limit - 1].rstrip() + "…"


def build_tree_from_text(text: str, *, root_title: str = "Documento") -> dict[str, Any]:
    """Split text into a hierarchical tree keyed by markdown headings or Art. N blocks."""
    nodes: dict[str, TreeNode] = {}
    root_id = "root"
    nodes[root_id] = TreeNode(
        id=root_id,
        title=root_title,
        summary=_summary(text, 160),
        content="",
        children=[],
    )

    headings = list(_HEADING_RE.finditer(text))
    if headings:
        for index, match in enumerate(headings):
            start = match.start()
            end = headings[index + 1].start() if index + 1 < len(headings) else len(text)
            title = match.group(2).strip()
            body = text[match.end() : end].strip()
            node_id = f"h{index + 1}"
            nodes[node_id] = TreeNode(
                id=node_id,
                title=title,
                summary=_summary(body),
                content=body,
                children=[],
            )
            nodes[root_id].children.append(node_id)
    else:
        # Fallback: chunk by paragraphs into leaf nodes
        chunks = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
        if not chunks:
            chunks = [text]
        for index, chunk in enumerate(chunks):
            node_id = f"p{index + 1}"
            title = _summary(chunk, 80)
            nodes[node_id] = TreeNode(
                id=node_id,
                title=title,
                summary=_summary(chunk),
                content=chunk,
                children=[],
            )
            nodes[root_id].children.append(node_id)

    return {
        "root_id": root_id,
        "nodes": {node_id: node.to_dict() for node_id, node in nodes.items()},
    }


def choose_indexing_mode(text: str, min_chars: int) -> IndexingMode:
    return "pageindex" if len(text) >= min_chars else "full"


def _tokenize(text: str) -> set[str]:
    return {w.lower() for w in _WORD_RE.findall(text)}


def _score_node(query: str, node: TreeNode) -> float:
    if node.id == "root" or not node.content:
        return 0.0

    score = 0.0
    q_arts = {m.group(1) for m in _ART_RE.finditer(query)}
    title_arts = {m.group(1) for m in _ART_RE.finditer(node.title)}
    if q_arts and title_arts & q_arts:
        score += 50.0

    q_tokens = _tokenize(query)
    if not q_tokens:
        return score

    hay = _tokenize(f"{node.title} {node.summary} {node.content[:4000]}")
    overlap = len(q_tokens & hay)
    score += overlap * 2.0
    # Prefer denser matches
    if hay:
        score += (overlap / max(len(q_tokens), 1)) * 5.0
    return score


def retrieve_from_tree(
    tree: dict[str, Any],
    query: str,
    *,
    max_chars: int,
    max_nodes: int = 8,
) -> list[dict[str, str]]:
    nodes = {
        node_id: TreeNode.from_dict(payload)
        for node_id, payload in tree.get("nodes", {}).items()
    }
    scored: list[tuple[float, TreeNode]] = []
    for node in nodes.values():
        score = _score_node(query, node)
        if score > 0:
            scored.append((score, node))

    scored.sort(key=lambda item: item[0], reverse=True)

    selected: list[dict[str, str]] = []
    used = 0
    for _, node in scored[:max_nodes]:
        content = node.content.strip()
        if not content:
            continue
        remaining = max_chars - used
        if remaining <= 0:
            break
        if len(content) > remaining:
            content = content[:remaining].rstrip() + "…"
        selected.append({"title": node.title, "content": content})
        used += len(content)

    if selected:
        return selected

    # Fallback: first non-empty leaves up to budget
    root = nodes.get(tree.get("root_id", "root"))
    child_ids = root.children if root else list(nodes.keys())
    for node_id in child_ids:
        node = nodes.get(node_id)
        if not node or not node.content:
            continue
        remaining = max_chars - used
        if remaining <= 0:
            break
        content = node.content[:remaining].rstrip()
        selected.append({"title": node.title, "content": content})
        used += len(content)
    return selected


def tree_outline(tree: dict[str, Any], *, limit: int = 80) -> str:
    """Compact table-of-contents for optional system map."""
    nodes = tree.get("nodes", {})
    root = nodes.get(tree.get("root_id", "root"), {})
    lines: list[str] = []
    for child_id in root.get("children", [])[:limit]:
        child = nodes.get(child_id, {})
        title = child.get("title", child_id)
        lines.append(f"- {title}")
    return "\n".join(lines)
