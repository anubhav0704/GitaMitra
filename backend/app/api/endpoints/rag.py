from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.services.rag import RAGQueryService, RAGContextBuilder

router = APIRouter()

class RAGSearchRequest(BaseModel):
    query: str = Field(..., min_length=2)
    top_k: int = Field(default=5, ge=1, le=20)

@router.post("/search", summary="Search for relevant Gita verses")
@router.post("/retrieve", summary="Retrieve relevant Gita verses for RAG context")
async def search_gita_verses(
    request: RAGSearchRequest,
    db: AsyncSession = Depends(get_db)
) -> Any:
    """
    Given a user query or situation, retrieves the most relevant Bhagavad Gita verses.
    This utilizes hybrid semantic + keyword + metadata search.
    """
    try:
        service = RAGQueryService(db)
        result = await service.search(query=request.query, top_k=request.top_k)
        
        # We also include a pre-built llm context block for convenience of Step 5.
        # Though the frontend or LLM layer can use the raw results list instead.
        result["llm_context"] = RAGContextBuilder.build_llm_context(result)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to perform RAG search: {str(e)}"
        )
