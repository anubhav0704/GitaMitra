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

class MockEmbeddingProvider(EmbeddingProvider):
    """Fast, lightweight fallback embedding provider when PyTorch/sentence-transformers is unavailable."""
    def __init__(self, dimension: int = 384):
        self._dimension = dimension

    @property
    def model_name(self) -> str:
        return "mock-384"

    @property
    def version(self) -> str:
        return "1.0"

    @property
    def dimension(self) -> int:
        return self._dimension

    def get_embedding(self, text: str) -> List[float]:
        import random
        seed = int(self.compute_hash(text)[:8], 16)
        rng = random.Random(seed)
        vec = [rng.uniform(-1.0, 1.0) for _ in range(self._dimension)]
        norm = sum(x * x for x in vec) ** 0.5 or 1.0
        return [x / norm for x in vec]

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        return [self.get_embedding(t) for t in texts]

class LocalEmbeddingProvider(EmbeddingProvider):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self._model_name = model_name
        try:
            import torch
            torch.set_num_threads(1)
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
            self.fallback = None
        except Exception as e:
            print(f"[Embeddings] Unable to load SentenceTransformer ({e}). Using MockEmbeddingProvider fallback.")
            self.model = None
            self.fallback = MockEmbeddingProvider()
    
    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def version(self) -> str:
        return "1.0"

    @property
    def dimension(self) -> int:
        return 384

    def get_embedding(self, text: str) -> List[float]:
        if self.model:
            try:
                return self.model.encode(text).tolist()
            except Exception:
                pass
        return self.fallback.get_embedding(text)

    def get_embeddings(self, texts: List[str]) -> List[List[float]]:
        if self.model:
            try:
                return self.model.encode(texts).tolist()
            except Exception:
                pass
        return self.fallback.get_embeddings(texts)

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

