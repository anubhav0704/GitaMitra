import asyncio
import os
import sys
from sqlalchemy.future import select

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import async_session_maker
from app.models.domain import User
from app.core.security import get_password_hash

async def make_admin(email: str, name: str = "Administrator", password: str = "Admin@123456"):
    async with async_session_maker() as session:
        stmt = select(User).where(User.email == email)
        result = await session.execute(stmt)
        user = result.scalar_one_or_none()

        if user:
            user.role = "admin"
            user.is_active = True
            await session.commit()
            print(f"SUCCESS: Existing user '{email}' elevated to 'admin'.")
        else:
            new_user = User(
                email=email,
                name=name,
                password_hash=get_password_hash(password),
                role="admin",
                is_active=True
            )
            session.add(new_user)
            await session.commit()
            print(f"SUCCESS: Created new admin user '{email}' with initial password '{password}'.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        target_email = "admin@gitamitra.org"
        print(f"No email specified. Using default: {target_email}")
    else:
        target_email = sys.argv[1].strip()

    asyncio.run(make_admin(target_email))
