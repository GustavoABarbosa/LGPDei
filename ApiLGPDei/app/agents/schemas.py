from typing import Literal

from pydantic import BaseModel, Field


class Finding(BaseModel):
    severity: Literal["critical", "high", "medium", "low"]
    title: str
    description: str
    legal_reference: str
    evidence: str
    recommendation: str


class AssessmentOutput(BaseModel):
    overall_risk: Literal["low", "medium", "high", "critical"]
    compliance_score: int = Field(ge=0, le=100)
    findings: list[Finding]
    strengths: list[str]
    summary: str
    disclaimer: str
