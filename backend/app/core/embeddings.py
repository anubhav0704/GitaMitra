import os
import hashlib
from typing import List, Optional
from abc import ABC, abstractmethod

class EmbeddingProvider(ABC):
    @property
    @abstractmethod
    def model_name(self) -> str:
        pass

    @property
    @abstractmethod
    def version(self) -> str:
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        pass

    @abstractmethod
    def get_embedding(self, text: str) -> List[float]:
        pass

    @abstractmethod
    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        pass

    def compute_hash(self, text: str) -> str:
        """Compute a deterministic hash for the embedding input text."""
        return hashlib.sha256(text.encode("utf-8")).hexdigest()

class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        # Import inside init so it's only loaded when needed
        from sentence_transformers import SentenceTransformer
        self._model_name = model_name
        self.model = SentenceTransformer(model_name)
    
    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def version(self) -> str:
        return "1.0"

    @property
    def dimension(self) -> int:
        # all-MiniLM-L6-v2 is 384-dimensional
        return 384

    def get_embedding(self, text: str) -> List[float]:
        return self.model.encode(text).tolist()

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return self.model.encode(texts).tolist()

_singleton_embedding_provider: Optional[EmbeddingProvider] = None

def get_embedding_provider() -> EmbeddingProvider:
    """Factory to get the configured embedding provider as a singleton."""
    global _singleton_embedding_provider
    if _singleton_embedding_provider is not None:
        return _singleton_embedding_provider

    provider_type = os.getenv("EMBEDDING_PROVIDER", "local").lower()
    
    if provider_type == "local":
        _singleton_embedding_provider = LocalEmbeddingProvider()
        return _singleton_embedding_provider
    else:
        raise ValueError(f"Unknown embedding provider: {provider_type}")

