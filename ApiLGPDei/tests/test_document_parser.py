import pytest

from app.services.document_parser import extract_document_text, is_supported_file


def test_is_supported_txt():
    assert is_supported_file("policy.txt", "text/plain") is True


def test_is_supported_unknown():
    assert is_supported_file("binary.exe", "application/octet-stream") is False


@pytest.mark.asyncio
async def test_extract_txt():
    text = await extract_document_text(
        b"Nome: Joao\nCPF: 123",
        "dados.txt",
        "text/plain",
    )
    assert "Joao" in text
