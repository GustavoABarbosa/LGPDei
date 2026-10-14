from app.agents.prompts import append_disclaimer, get_disclaimer, strip_disclaimer

ANSWER = "A LGPD exige uma base legal."
WITH_DISCLAIMER = f"{ANSWER}\n\n_{get_disclaimer('pt')}_"


def test_append_adds_disclaimer_once():
    assert append_disclaimer(ANSWER, "pt") == WITH_DISCLAIMER
    assert append_disclaimer(WITH_DISCLAIMER, "pt") == WITH_DISCLAIMER


def test_strip_removes_every_trailing_disclaimer():
    duplicated = f"{WITH_DISCLAIMER}\n\n_{get_disclaimer('pt')}_\n\n{get_disclaimer('en')}"
    assert strip_disclaimer(duplicated) == ANSWER
    assert strip_disclaimer(ANSWER) == ANSWER
