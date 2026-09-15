import logging
from app.llm.providers.openai import OpenAIProvider

logger = logging.getLogger(__name__)

# Best available text-output models on Groq Cloud (Sep 2026)
GROQ_STABLE_DEFAULT = "openai/gpt-oss-120b"

# Models known to produce empty/think-only content (reasoning-only output)
GROQ_THINKING_MODELS = {
    "qwen/qwen3.8-27b",
    "qwen/qwen3.32b",
    "qwen/qwen3.8b",
}

# Models that have been decommissioned by Groq
GROQ_DECOMMISSIONED_MODELS = {
    "mixtral-8x7b-32768",
}


class GroqProvider(OpenAIProvider):
    """
    Groq Cloud API provider — uses the OpenAI-compatible endpoint.

    Model selection rules:
    - Uses openai/gpt-oss-120b by default (reliable text output, high performance).
    - Automatically redirects Qwen3 thinking-mode models to the stable default,
      since those return only reasoning tokens and produce empty 'content' fields.
    - Redirects decommissioned models (e.g. mixtral-8x7b-32768) to the default.
    - Redirects non-Groq model names (e.g. gpt-4o, gemini-1.5-pro) to the default.
    """

    def __init__(
        self,
        api_key: str,
        model: str = GROQ_STABLE_DEFAULT,
        base_url: str = "https://api.groq.com/openai/v1"
    ):
        model = (model or "").strip()

        lower_model = model.lower()
        is_unsupported = (
            not lower_model
            # Block OpenAI-native GPT-4 models (not hosted on Groq)
            # but allow Groq-hosted "openai/gpt-oss-*" models
            or (lower_model.startswith("gpt-") and not lower_model.startswith("openai/"))
            or lower_model.startswith("gemini")
            or lower_model in GROQ_THINKING_MODELS
            or lower_model in GROQ_DECOMMISSIONED_MODELS
        )

        if is_unsupported:
            logger.warning(
                f"Groq model '{model}' is unavailable, decommissioned, or produces empty output. "
                f"Falling back to '{GROQ_STABLE_DEFAULT}'."
            )
            model = GROQ_STABLE_DEFAULT

        fallback_models = ["openai/gpt-oss-20b", "groq/compound-mini"]
        super().__init__(api_key=api_key, model=model, base_url=base_url, fallback_models=fallback_models)
