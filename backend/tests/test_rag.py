import pytest
from app.core.embeddings import get_embedding_provider, LocalEmbeddingProvider

def test_embedding_provider():
    # Since we set EMBEDDING_PROVIDER to local or default, this should return LocalEmbeddingProvider
    provider = get_embedding_provider()
    
    assert isinstance(provider, LocalEmbeddingProvider)
    assert provider.dimension == 384
    assert provider.model_name == "all-MiniLM-L6-v2"
    
    # Test hashing
    text = "Hello world"
    text_hash = provider.compute_hash(text)
    assert len(text_hash) == 64  # sha256
    
    # Test identical hash for identical text
    assert provider.compute_hash(text) == text_hash

def test_embedding_generation():
    provider = get_embedding_provider()
    
    emb = provider.get_embedding("Test verse")
    assert len(emb) == 384
    
    embs = provider.get_embeddings(["Test verse 1", "Test verse 2"])
    assert len(embs) == 2
    assert len(embs[0]) == 384
