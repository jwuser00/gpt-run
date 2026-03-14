import os

from langchain_anthropic import ChatAnthropic
from langchain_openai import ChatOpenAI


LLM_HIGH_MODEL = os.getenv("LLM_HIGH_MODEL", "claude-haiku-4-5-20251001")
LLM_LOW_MODEL = os.getenv("LLM_LOW_MODEL", "claude-haiku-4-5-20251001")


def get_llm(tier: str = "low"):
    """tier에 따라 LLM 인스턴스를 반환한다."""
    model_name = LLM_HIGH_MODEL if tier == "high" else LLM_LOW_MODEL

    if model_name.startswith("gpt"):
        return ChatOpenAI(model=model_name, max_tokens=500)

    return ChatAnthropic(model=model_name, max_tokens=500)
