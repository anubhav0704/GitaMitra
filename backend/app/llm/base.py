from abc import ABC, abstractmethod
from typing import AsyncGenerator, Dict, Any, List, Optional

class LLMResponse:
    def __init__(self, content: str, model: str, usage: Optional[Dict[str, int]] = None):
        self.content = content
        self.model = model
        self.usage = usage or {}

class LLMProvider(ABC):
    """Abstract base class for all LLM providers in GitaMitra."""
    
    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs: Any
    ) -> LLMResponse:
        """Generate a complete text response asynchronously."""
        pass

    @abstractmethod
    async def stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.3,
        max_tokens: int = 1024,
        **kwargs: Any
    ) -> AsyncGenerator[str, None]:
        """Stream chunks/tokens of text asynchronously."""
        pass
