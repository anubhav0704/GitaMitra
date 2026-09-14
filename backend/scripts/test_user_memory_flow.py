import asyncio
import os
import sys
import uuid

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.append("/app")

from sqlalchemy import select, delete

from app.core.database import async_session_maker
from app.models.domain import User, Memory
from app.services.memory.extraction_service import MemoryExtractionService
from app.services.memory.retrieval_service import MemoryRetrievalService
from app.llm.prompt_builder import PromptBuilder
from app.services.memory.retrieval_service import MemoryContextBuilder

async def main():
    print("==================================================")
    print("TESTING USER SEQUENCE STEP 6 FLOW")
    print("==================================================")

    async with async_session_maker() as db:
        user = User(
            email=f"journey_tester_{uuid.uuid4().hex[:6]}@example.com",
            password_hash="testhash",
            name="Journey Seeker"
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

        svc = MemoryExtractionService(db)
        retrieval = MemoryRetrievalService(db)

        # ----------------------------------------------------
        # Conversation 1: "I'm preparing for placements."
        # ----------------------------------------------------
        msg1 = "I'm preparing for placements."
        print(f"\n[Conversation 1] User: \"{msg1}\"")
        await svc.process_turn(user=user, user_message=msg1)

        mems1 = (await db.execute(select(Memory).where(Memory.user_id == user.id))).scalars().all()
        print(f"Memories in DB after Conv 1 ({len(mems1)}):")
        for m in mems1:
            print(f"  - [{m.type}] {m.content} (importance: {m.importance}, active: {m.is_active})")

        # ----------------------------------------------------
        # Conversation 2: "I failed my interview."
        # ----------------------------------------------------
        msg2 = "I failed my interview."
        print(f"\n[Conversation 2] User: \"{msg2}\"")
        await svc.process_turn(user=user, user_message=msg2)

        mems2 = (await db.execute(select(Memory).where(Memory.user_id == user.id))).scalars().all()
        print(f"Memories in DB after Conv 2 ({len(mems2)}):")
        for m in mems2:
            print(f"  - [{m.type}] {m.content} (importance: {m.importance}, active: {m.is_active})")

        # ----------------------------------------------------
        # Conversation 3: "I have another interview tomorrow and I'm scared."
        # ----------------------------------------------------
        msg3 = "I have another interview tomorrow and I'm scared."
        print(f"\n[Conversation 3] User: \"{msg3}\"")
        retrieved = await retrieval.retrieve_relevant_memories(user=user, query=msg3)
        print(f"Retrieved Memories for Conv 3 Prompt ({len(retrieved)}):")
        for r in retrieved:
            m = r["memory"]
            print(f"  - Score: {r['score']:.4f} | [{m.type}] {m.content}")

        context_block = MemoryContextBuilder.build_user_memory_context(retrieved)
        print("\nGenerated <user_memory> Context Block injected into Prompt:")
        print("--------------------------------------------------")
        print(context_block)
        print("--------------------------------------------------")

        # Cleanup
        await db.execute(delete(Memory).where(Memory.user_id == user.id))
        await db.execute(delete(User).where(User.id == user.id))
        await db.commit()

    print("\nSUCCESS: User memory sequence verified end-to-end!")

if __name__ == "__main__":
    asyncio.run(main())
