import logging
from app.llm.providers.openai import OpenAIProvider

logger = logging.getLogger(__name__)

# Best available text-output model on this Groq account
GROQ_STABLE_DEFAULT = "openai/gpt-oss-120b"

# Models known to produce empty/think-only content on Groq (thinking mode enabled)
GROQ_THINKING_MODELS = {
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.32b",
    "qwen/qwen3.8b",
}


class GroqProvider(OpenAIProvider):
    """
    Groq Cloud API provider — uses the OpenAI-compatible endpoint.

    Model selection rules:
    - Uses openai/gpt-oss-120b by default (reliable text output, no thinking mode).
    - Automatically redirects Qwen3 thinking-mode models to the stable default,
      since those return only reasoning tokens and produce empty 'content' fields.
    - Also redirects OpenAI/Gemini model names that don't exist on Groq.
    """

    def __init__(
        self,
        api_key: str,
        model: str = GROQ_STABLE_DEFAULT,
        base_url: str = "https://api.groq.com/openai/v1"
    ):
        model = (model or "").strip()

        is_unsupported = (
            not model
            or model.startswith("gpt-4")   # OpenAI GPT-4 variants — not on Groq
            or model.startswith("gemini-")  # Google Gemini — not on Groq
            or model == "llama-3.3-70b-versatile"   # No longer available on Groq
            or model.lower() in GROQ_THINKING_MODELS
        )

        if is_unsupported:
            logger.warning(
                f"Groq model '{model}' is unavailable or produces empty output. "
                f"Falling back to '{GROQ_STABLE_DEFAULT}'."
            )
            model = GROQ_STABLE_DEFAULT

        logger.info(f"GroqProvider initialised with model: {model}")
        fallback_models = ["openai/gpt-oss-20b"] if model != "openai/gpt-oss-20b" else ["openai/gpt-oss-120b"]
        super().__init__(api_key=api_key, model=model, base_url=base_url, fallback_models=fallback_models)
