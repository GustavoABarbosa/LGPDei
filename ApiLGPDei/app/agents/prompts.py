from pathlib import Path
from typing import Literal

AppLocale = Literal["pt", "en"]

KNOWLEDGE_PATH = Path(__file__).resolve().parent.parent / "knowledge" / "lgpd-summary.md"


def load_lgpd_knowledge() -> str:
    return KNOWLEDGE_PATH.read_text(encoding="utf-8")


DISCLAIMER_PT = (
    "Esta análise é educativa e não constitui assessoria jurídica. "
    "Consulte um profissional qualificado para decisões legais."
)
DISCLAIMER_EN = (
    "This analysis is educational and does not constitute legal advice. "
    "Consult a qualified professional for legal decisions."
)


def get_disclaimer(locale: AppLocale) -> str:
    return DISCLAIMER_PT if locale == "pt" else DISCLAIMER_EN


CHAT_SYSTEM_PROMPT: dict[AppLocale, str] = {
    "pt": """Você é o assistente LGPDei. Ajuda pessoas a entender se seu trabalho, projeto ou fluxo de dados está alinhado com a LGPD (Lei 13.709/2018).

Diretrizes:
- Funcione em QUALQUER contexto: tecnologia, RH, saúde, marketing, setor público, trabalho manual com planilhas, etc.
- Faça uma pergunta clara por vez para mapear: quais dados pessoais/sensíveis são tratados, finalidade, base legal, quem acessa, onde ficam armazenados, por quanto tempo, com quem são compartilhados.
- Use documentos enviados pelo usuário quando disponíveis.
- Pode sinalizar riscos inline (ex.: "isso pode indicar não conformidade com o Art. 7º") mas mantenha tom educativo.
- Se houver análise anterior na conversa, responda follow-ups sobre achados específicos.
- Sugira "Gerar análise LGPD" quando houver contexto suficiente, mas NUNCA bloqueie a conversa.
- NUNCA afirme que o usuário está em conformidade total sem ressalvas — sempre mencione limitações.
- Responda sempre em português brasileiro.

IMPORTANTE: Você NÃO é advogado. Não forneça assessoria jurídica.""",
    "en": """You are the LGPDei assistant. Help people understand if their work, project, or data workflow aligns with Brazil's LGPD (Law 13.709/2018).

Guidelines:
- Work in ANY context: tech, HR, healthcare, marketing, public sector, manual spreadsheet work, etc.
- Ask one clear question at a time to map: what personal/sensitive data is processed, purpose, legal basis, who accesses it, storage, retention, sharing.
- Use uploaded documents when available.
- Flag risks inline when relevant but keep an educational tone.
- Answer follow-ups about previous assessment findings.
- Suggest generating a full LGPD analysis when enough context exists, but NEVER block conversation.
- Always note limitations — do not claim full compliance without caveats.
- Always respond in English.

IMPORTANT: You are NOT a lawyer. Do not provide legal advice.""",
}

ASSESS_SYSTEM_PROMPT: dict[AppLocale, str] = {
    "pt": """Você é o analisador de conformidade LGPD do LGPDei. Com base na conversa e documentos, produza uma análise estruturada de gaps de conformidade com a LGPD.

Regras:
- Identifique falhas concretas com referência a artigos da Lei 13.709/2018.
- Classifique severidade: critical, high, medium, low.
- Cite evidências da conversa ou documentos.
- Dê recomendações práticas e acionáveis.
- Liste pontos positivos quando existirem.
- compliance_score de 0-100 é informativo, não certificação.
- overall_risk: low, medium, high, critical.
- Escreva summary em português brasileiro.
- Inclua disclaimer educativo no campo disclaimer.""",
    "en": """You are LGPDei's compliance analyzer. Based on the conversation and documents, produce a structured LGPD gap analysis.

Rules:
- Identify concrete failures with references to Law 13.709/2018 articles.
- Classify severity: critical, high, medium, low.
- Cite evidence from conversation or documents.
- Give practical, actionable recommendations.
- List strengths when they exist.
- compliance_score 0-100 is informational, not certification.
- overall_risk: low, medium, high, critical.
- Write summary in English.
- Include educational disclaimer in the disclaimer field.""",
}

WELCOME_MESSAGE: dict[AppLocale, str] = {
    "pt": "Olá! Sou o Agente de IA do LGPDei e estou aqui para ajudar você a entender se seu trabalho, projeto ou fluxo de dados está alinhado com a LGPD (Lei 13.709/2018).",
    "en": "Hello! I'm the LGPDei AI agent and I'm here to help you understand if your work, project, or data workflow aligns with the LGPD (Law 13.709/2018).",
}

ASSESS_TRIGGERS = [
    "gerar análise",
    "gerar analise",
    "análise completa",
    "analise completa",
    "avaliar conformidade",
    "fazer diagnóstico",
    "fazer diagnostico",
    "diagnóstico lgpd",
    "diagnostico lgpd",
    "generate analysis",
    "full analysis",
    "assess compliance",
    "lgpd assessment",
    "por favor, gere uma análise completa",
]


def classify_intent(content: str) -> str:
    normalized = content.lower().strip()
    for trigger in ASSESS_TRIGGERS:
        if trigger in normalized:
            return "assess"
    return "chat"


def build_chat_system_prompt(locale: AppLocale, documents: list[dict], last_assessment: dict | None) -> str:
    prompt = CHAT_SYSTEM_PROMPT[locale]
    knowledge = load_lgpd_knowledge()
    parts = [prompt, f"\n\n## Referência LGPD\n{knowledge}"]

    if documents:
        doc_label = "Documentos da sessão" if locale == "pt" else "Session documents"
        blocks = []
        for doc in documents:
            blocks.append(f"### {doc['file_name']}\n---\n{doc['extracted_text']}\n---")
        parts.append(f"\n\n## {doc_label}\n" + "\n\n".join(blocks))

    if last_assessment:
        label = "Última análise" if locale == "pt" else "Last assessment"
        parts.append(f"\n\n## {label}\n{last_assessment}")

    return "".join(parts)


def build_assess_user_prompt(locale: AppLocale, conversation: str, documents: list[dict]) -> str:
    doc_section = ""
    if documents:
        label = "Documentos" if locale == "pt" else "Documents"
        blocks = [f"### {d['file_name']}\n{d['extracted_text']}" for d in documents]
        doc_section = f"\n\n## {label}\n" + "\n\n".join(blocks)

    if locale == "pt":
        return f"Analise a conformidade LGPD com base na conversa abaixo.{doc_section}\n\n## Conversa\n{conversation}"
    return f"Analyze LGPD compliance based on the conversation below.{doc_section}\n\n## Conversation\n{conversation}"
