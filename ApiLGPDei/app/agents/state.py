from typing import Literal, TypedDict

from langchain_core.messages import BaseMessage

from app.agents.schemas import AssessmentOutput


class DocumentContext(TypedDict):
    file_name: str
    extracted_text: str


class GraphState(TypedDict, total=False):
    session_id: str
    locale: Literal["pt", "en"]
    messages: list[BaseMessage]
    documents: list[DocumentContext]
    last_assessment: dict | None
    user_content: str
    intent: Literal["chat", "assess"]
    response_content: str
    assessment_output: AssessmentOutput | None
    stream: bool
