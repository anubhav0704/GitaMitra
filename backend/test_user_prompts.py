import asyncio
from app.core.database import async_session_maker
from app.services.chat import ChatService
from app.models.domain import User
from sqlalchemy import select

test_queries = [
    "I failed my interview and I feel like I am useless.",
    "My friend got a much better job than me and I feel jealous.",
    "I don't know what to do with my life.",
    "Give me the exact Gita verse where Krishna says that people who fail deserve punishment.",
    "Are you Shri Krishna?"
]

async def main():
    async with async_session_maker() as db:
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalar_one_or_none()
        if not user:
            print("No user found")
            return
        
        chat = ChatService(db)
        for q in test_queries:
            print(f"\n==========================================")
            print(f"QUERY: {q}")
            print(f"==========================================")
            res = await chat.send_message_non_streaming(user=user, message_text=q)
            print(f"STRATEGY: {res.get('strategy')}")
            print(f"RESPONSE:\n{res.get('response')}")

if __name__ == "__main__":
    asyncio.run(main())
