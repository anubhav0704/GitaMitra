import logging
from app.llm.providers.openai import OpenAIProvider

logger = logging.getLogger(__name__)

# Best available text-output models on Groq Cloud
GROQ_STABLE_DEFAULT = "llama-3.3-70b-versatile"

# Models known to produce empty/think-only content or invalid names
GROQ_THINKING_MODELS = {
    "qwen/qwen3.8-27b",
    "qwen/qwen3.6-27b",
    "qwen/qwen3.32b",
    "qwen/qwen3.8b",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b"
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

        lower_model = model.lower()
        is_unsupported = (
            not lower_model
            or lower_model.startswith("gpt-") 
            or lower_model.startswith("gemini")
            or lower_model in GROQ_THINKING_MODELS
        )

        if is_unsupported:
            logger.warning(
                f"Groq model '{model}' is unavailable or produces empty output. "
                f"Falling back to '{GROQ_STABLE_DEFAULT}'."
            )
            model = GROQ_STABLE_DEFAULT

        logger.info(f"GroqProvider initialised with model: {model}")
        fallback_models = ["llama-3.1-8b-instant", "mixtral-8x7b-32768"]
        super().__init__(api_key=api_key, model=model, base_url=base_url, fallback_models=fallback_models)
