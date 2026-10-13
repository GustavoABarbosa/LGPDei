import json

from langchain_core.language_models.fake_chat_models import GenericFakeChatModel
from langchain_core.runnables import RunnableLambda

from app.agents.schemas import AssessmentOutput, Finding

FAKE_CHAT_REPLY = "A LGPD exige uma base legal para cada tratamento de dados."

FAKE_ASSESSMENT = AssessmentOutput(
    overall_risk="high",
    compliance_score=42,
    findings=[
        Finding(
            severity="high",
            title="Sem base legal",
            description="Dados de clientes são usados para marketing sem consentimento.",
            legal_reference="Art. 7º, I",
            evidence="Relato do usuário",
            recommendation="Coletar consentimento específico.",
        )
    ],
    strengths=["Acesso restrito ao banco de dados"],
    summary="Há lacunas relevantes de base legal.",
    disclaimer="",
)


class FakeChatModel(GenericFakeChatModel):
    def with_structured_output(self, schema, **kwargs):  # type: ignore[override]
        return RunnableLambda(lambda _messages: FAKE_ASSESSMENT.model_copy(deep=True))


def parse_sse(body: str) -> list[dict]:
    return [
        json.loads(line.removeprefix("data: "))
        for line in body.splitlines()
        if line.startswith("data: ") and line != "data: [DONE]"
    ]
