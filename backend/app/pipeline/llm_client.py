from __future__ import annotations

from openai import OpenAI

from app.config import Settings


def get_llm_client(settings: Settings) -> OpenAI:
    return OpenAI(
        api_key=settings.groq_api_key,
        base_url=settings.groq_base_url,
    )
