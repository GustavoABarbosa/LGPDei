from typing import Literal, TypedDict

from langchain_core.messages import BaseMessage

from app.agents.schemas import AssessmentOutput


class DocumentContext(TypedDict, total=False):
    file_name: str
    extracted_text: str
    indexing_mode: str
    page_index_tree: dict | None


class GraphState(TypedDict, total=False):
    session_id: str
    locale: Literal["pt", "en"]
    messages: list[BaseMessage]
    documents: list[DocumentContext]
    law_excerpts: list[dict[str, str]]
    last_assessment: dict | None
    user_content: str
    intent: Literal["chat", "assess"]
    response_content: str
    assessment_output: AssessmentOutput | None
    stream: bool
