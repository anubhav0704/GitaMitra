import os
import logging
from app.core.config import settings
from app.llm.base import LLMProvider
from app.llm.providers.openai import OpenAIProvider
from app.llm.providers.gemini import GeminiProvider
from app.llm.providers.groq import GroqProvider
from app.llm.providers.mock import MockProvider

logger = logging.getLogger(__name__)

def get_llm_provider() -> LLMProvider:
    """Factory to return the configured LLM provider instance."""
    provider_type = (settings.LLM_PROVIDER or "mock").lower()
    
    api_key = settings.LLM_API_KEY or os.environ.get("LLM_API_KEY")
    openai_key = settings.OPENAI_API_KEY or os.environ.get("OPENAI_API_KEY")
    gemini_key = settings.GEMINI_API_KEY or os.environ.get("GEMINI_API_KEY")
    groq_key = getattr(settings, "GROQ_API_KEY", "") or os.environ.get("GROQ_API_KEY")

    # 0. Check for explicit Mock provider
    if provider_type == "mock":
        logger.info("Using MockProvider (local grounded Gita synthesizer)")
        return MockProvider(model="gitamitra-local-v1")

    # 1. Check for Groq (either explicit provider, or key starting with gsk_)
    if provider_type == "groq" or (api_key and api_key.startswith("gsk_")) or (openai_key and openai_key.startswith("gsk_")) or groq_key:
        active_groq_key = groq_key or (api_key if api_key and api_key.startswith("gsk_") else openai_key)
        if active_groq_key:
            model = settings.LLM_MODEL or "llama-3.3-70b-versatile"
            logger.info(f"Using GroqProvider with model {model}")
            return GroqProvider(api_key=active_groq_key, model=model)

    # 2. Check for OpenAI
    if provider_type == "openai" or (provider_type != "gemini" and provider_type != "mock" and openai_key):
        active_openai_key = openai_key or (api_key if api_key and not api_key.startswith("gsk_") else None)
        if active_openai_key:
            logger.info(f"Using OpenAIProvider with model {settings.LLM_MODEL}")
            return OpenAIProvider(api_key=active_openai_key, model=settings.LLM_MODEL)
        else:
            logger.warning("OpenAI provider requested but no API key found. Falling back to MockProvider.")

    # 3. Check for Gemini
    elif provider_type == "gemini":
        active_gemini_key = gemini_key or api_key
        if active_gemini_key:
            logger.info(f"Using GeminiProvider with model {settings.LLM_MODEL}")
            return GeminiProvider(api_key=active_gemini_key, model=settings.LLM_MODEL or "gemini-1.5-flash")
        else:
            logger.warning("Gemini provider requested but no API key found. Falling back to MockProvider.")

    # 4. Default / Fallback to intelligent local synthesizer
    logger.info("Using MockProvider (local grounded Gita synthesizer)")
    return MockProvider(model="gitamitra-local-v1")
