import asyncio
import json
import os
import sys
import time

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_maker
from app.services.rag import RAGQueryService

async def evaluate():
    data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "evaluation", "rag_questions.json")
    with open(data_path, "r") as f:
        questions = json.load(f)
        
    print(f"## RAG Evaluation")
    print(f"Total questions: {len(questions)}")
    
    top_1_hits = 0
    top_3_hits = 0
    top_5_hits = 0
    no_results = 0
    total_time = 0.0
    
    async with async_session_maker() as db:
        service = RAGQueryService(db)
        
        for q in questions:
            start_time = time.time()
            result = await service.search(q["question"], top_k=5)
            latency = time.time() - start_time
            total_time += latency
            
            retrieved_verses = []
            if result["has_relevant_context"]:
                retrieved_verses = [f"{item['chapter']}.{item['verse']}" for item in result["results"]]
                if q == questions[0] or q == questions[1]:
                    print(f"Debug query '{q['question']}'")
                    print(f"  Expected: {q['expected_verses']}")
                    print(f"  Retrieved: {retrieved_verses}")
            else:
                no_results += 1
                
            expected = set(q["expected_verses"])
            
            if retrieved_verses and retrieved_verses[0] in expected:
                top_1_hits += 1
                top_3_hits += 1
                top_5_hits += 1
            elif any(v in expected for v in retrieved_verses[:3]):
                top_3_hits += 1
                top_5_hits += 1
            elif any(v in expected for v in retrieved_verses[:5]):
                top_5_hits += 1
                
    total = len(questions)
    
    print(f"Top-1: {(top_1_hits/total)*100:.1f}%")
    print(f"Top-3: {(top_3_hits/total)*100:.1f}%")
    print(f"Top-5: {(top_5_hits/total)*100:.1f}%")
    print(f"No relevant result: {(no_results/total)*100:.1f}%")
    print(f"Average latency: {(total_time/total)*1000:.1f} ms")
    
if __name__ == "__main__":
    asyncio.run(evaluate())
