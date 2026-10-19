from langchain_anthropic import ChatAnthropic
from langchain_core.messages import AIMessage, HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.prompts import (
    build_assess_system_prompt,
    build_assess_user_prompt,
    build_chat_system_prompt,
    classify_intent,
    format_lgpd_excerpts,
    format_untrusted_documents,
    get_disclaimer,
)
from app.agents.schemas import AssessmentOutput
from app.agents.state import GraphState
from app.config import settings


def create_chat_model() -> ChatAnthropic:
    return ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
        streaming=True,
    )


async def router_node(state: GraphState) -> dict:
    intent = classify_intent(state.get("user_content", ""))
    return {"intent": intent}


async def chat_node(state: GraphState) -> dict:
    locale = state.get("locale", "pt")
    model = create_chat_model()
    system = build_chat_system_prompt(locale, state.get("last_assessment"))

    context_parts: list[str] = []
    law_block = format_lgpd_excerpts(state.get("law_excerpts") or [], locale)
    if law_block:
        context_parts.append(law_block)
    docs_block = format_untrusted_documents(state.get("documents") or [], locale)
    if docs_block:
        context_parts.append(docs_block)

    lc_messages: list = [SystemMessage(content=system)]
    if context_parts:
        lc_messages.append(HumanMessage(content="\n\n".join(context_parts)))
    lc_messages.extend(state.get("messages", []))

    response = await model.ainvoke(lc_messages)
    return {"response_content": response.text}


async def assess_node(state: GraphState) -> dict:
    locale = state.get("locale", "pt")
    model = create_chat_model()
    structured = model.with_structured_output(AssessmentOutput, method="json_schema")

    conversation_lines: list[str] = []
    for msg in state.get("messages", []):
        if isinstance(msg, HumanMessage):
            conversation_lines.append(f"Usuário: {msg.content}")
        elif isinstance(msg, AIMessage):
            conversation_lines.append(f"Assistente: {msg.content}")

    conversation = "\n".join(conversation_lines)
    system = build_assess_system_prompt(locale)
    user_prompt = build_assess_user_prompt(
        locale,
        conversation,
        state.get("documents") or [],
        state.get("law_excerpts") or [],
    )

    result = await structured.ainvoke(
        [SystemMessage(content=system), HumanMessage(content=user_prompt)]
    )

    if isinstance(result, dict):
        assessment = AssessmentOutput(**result)
    else:
        assessment = result

    assessment.disclaimer = get_disclaimer(locale)

    summary_intro = (
        "## Análise de Conformidade LGPD\n\n"
        if locale == "pt"
        else "## LGPD Compliance Analysis\n\n"
    )
    response_content = (
        f"{summary_intro}{assessment.summary}\n\n"
        f"**{'Risco geral' if locale == 'pt' else 'Overall risk'}:** {assessment.overall_risk} | "
        f"**Score:** {assessment.compliance_score}/100\n\n"
        f"_{assessment.disclaimer}_"
    )

    return {
        "response_content": response_content,
        "assessment_output": assessment,
    }


def build_graph():
    graph = StateGraph(GraphState)
    graph.add_node("router", router_node)
    graph.add_node("chat", chat_node)
    graph.add_node("assess", assess_node)

    graph.add_edge(START, "router")

    def route_after_router(state: GraphState) -> str:
        return "assess" if state.get("intent") == "assess" else "chat"

    graph.add_conditional_edges("router", route_after_router, {"chat": "chat", "assess": "assess"})
    graph.add_edge("chat", END)
    graph.add_edge("assess", END)

    return graph.compile()


agent_graph = build_graph()
