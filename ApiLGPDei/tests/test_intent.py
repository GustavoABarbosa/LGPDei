import pytest

from app.agents.prompts import classify_intent


@pytest.mark.parametrize(
    "content,expected",
    [
        ("Por favor, gere uma análise completa de conformidade LGPD", "assess"),
        ("gerar análise lgpd", "assess"),
        ("Como funciona o consentimento?", "chat"),
        ("Trabalho em um consultório odontológico", "chat"),
    ],
)
def test_classify_intent(content: str, expected: str):
    assert classify_intent(content) == expected
