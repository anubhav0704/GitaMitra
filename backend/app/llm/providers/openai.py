import json
import logging
import asyncio
from typing import AsyncGenerator, Dict, Any, Optional
import httpx

from app.llm.base import LLMProvider, LLMResponse

logger = logging.getLogger(__name__)

class OpenAIProvider(LLMProvider):
    """OpenAI API provider implementation with streaming support and multi-model failover."""

    def __init__(
        self,
        api_key: str,
        model: str = "gpt-4o-mini",
        base_url: str = "https://api.openai.com/v1",
        fallback_models: Optional[list] = None
    ):
        self.api_key = api_key
        self.model = model
        self.base_url = base_url.rstrip("/")
        self.fallback_models = fallback_models or []

    def _build_messages(self, prompt: str, system_prompt: Optional[str] = None):
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        return messages

    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs: Any
    ) -> LLMResponse:
        messages = self._build_messages(prompt, system_prompt)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "GitaMitra/1.0"
        }

        models_to_try = [self.model] + [m for m in self.fallback_models if m != self.model]
        last_error = None

        for current_model in models_to_try:
            payload = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0, read=60.0)) as client:
                    resp = await client.post(f"{self.base_url}/chat/completions", json=payload, headers=headers)
                    if resp.status_code == 429:
                        logger.warning(f"Model {current_model} rate-limited (429). Attempting fallback...")
                        continue
                    if resp.status_code >= 400:
                        await resp.aread()
                        logger.error(f"HTTP {resp.status_code} Error from {current_model}: {resp.text}")
                        resp.raise_for_status()
                    data = resp.json()
                    choice = data["choices"][0]
                    content = choice["message"].get("content") or choice["message"].get("reasoning_content") or ""
                    if not content:
                        content = "I am here with you. Please share what is on your mind."
                    usage = data.get("usage", {})
                    return LLMResponse(content=content, model=current_model, usage=usage)
            except Exception as e:
                err_msg = str(e)
                if hasattr(e, 'response') and e.response is not None:
                    try:
                        err_msg += f" - Response: {e.response.text}"
                    except Exception:
                        pass
                last_error = err_msg
                logger.warning(f"Error calling {current_model}: {last_error}. Trying fallback...")
                continue

        logger.error(f"All LLM models failed. Last error: {last_error}")
        return LLMResponse(
            content=f"⚠️ **System Error: LLM API Connection Failed**\n\nThe AI provider could not be reached or rejected the request. Please check your API key, model name, and rate limits in the Render dashboard.\n\n*Error details: {last_error}*",
            model=self.model,
            usage={}
        )

    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        messages = self._build_messages(prompt, system_prompt)
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "GitaMitra/1.0"
        }

        models_to_try = [self.model] + [m for m in self.fallback_models if m != self.model]

        for current_model in models_to_try:
            payload = {
                "model": current_model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }
            try:
                async with httpx.AsyncClient(timeout=httpx.Timeout(60.0, connect=10.0, read=60.0)) as client:
                    async with client.stream("POST", f"{self.base_url}/chat/completions", json=payload, headers=headers) as response:
                        if response.status_code == 429:
                            logger.warning(f"Model {current_model} rate limited (429) in stream. Immediately trying fallback...")
                            continue
                        if response.status_code >= 400:
                            await response.aread()
                            logger.error(f"HTTP {response.status_code} Error from {current_model}: {response.text}")
                            response.raise_for_status()
                            
                        yielded_any = False
                        async for line in response.aiter_lines():
                            if not line or not line.startswith("data: "):
                                continue
                            data_str = line[6:].strip()
                            if data_str == "[DONE]":
                                break
                            try:
                                chunk = json.loads(data_str)
                                delta = chunk["choices"][0].get("delta", {})
                                content = delta.get("content") or delta.get("reasoning_content")
                                if content:
                                    yielded_any = True
                                    yield content
                            except Exception:
                                pass
                        if yielded_any:
                            return
            except Exception as e:
                err_msg = str(e)
                if hasattr(e, 'response') and e.response is not None:
                    try:
                        err_msg += f" - Response: {e.response.text}"
                    except Exception:
                        pass
                last_error = err_msg
                logger.warning(f"Model {current_model} stream error: {last_error}. Trying fallback...")
                continue

        logger.error(f"All LLM models in stream failed. Last error: {last_error}")
        yield f"⚠️ **System Error: LLM API Connection Failed**\n\nThe AI provider could not be reached or rejected the request. Please check your API key, model name, and rate limits in the Render dashboard.\n\n*Error details: {last_error}*"
