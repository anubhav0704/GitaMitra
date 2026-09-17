from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
import secrets
import httpx

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models.domain import User
from app.schemas.auth import UserCreate, UserLogin, UserResponse, ChangePasswordRequest, ProfilePictureUpdate, GoogleAuthRequest
from app.api.deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not verify_password(data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    if verify_password(data.new_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from current password"
        )
        
    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    
    return {"message": "Password changed successfully"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    # Check if user already exists
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Check if user should be auto-assigned admin role
    admin_emails = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]
    user_role = "admin" if user_data.email.lower() in admin_emails else "user"

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        name=user_data.name,
        password_hash=hashed_password,
        role=user_role,
    )
    
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    return new_user

@router.post("/login")
async def login(response: Response, user_data: UserLogin, db: AsyncSession = Depends(get_db)):
    # Find user by email
    stmt = select(User).where(User.email == user_data.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user")
        
    # Auto-elevate to admin if email matches ADMIN_EMAILS
    admin_emails = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]
    if user.email.lower() in admin_emails and user.role != "admin":
        user.role = "admin"

    # Update last login
    user.last_login_at = datetime.utcnow()
    await db.commit()
    
    # Generate access token
    access_token = create_access_token(subject=str(user.id))
    
    # Set HttpOnly cookie with SameSite=None and Secure=True for cross-origin support
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        httponly=True,
        samesite="none",
        secure=True,
        max_age=7 * 24 * 60 * 60, # 7 days
    )
    
    return {
        "message": "Successfully logged in",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "role": user.role,
        }
    }

@router.post("/google")
async def google_auth(response: Response, auth_data: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    # 1. Verify Google ID token with Google's tokeninfo endpoint
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            res = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": auth_data.credential}
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Unable to reach Google OAuth verification servers: {str(e)}"
        )

    if res.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired Google authentication token"
        )

    payload = res.json()

    # 2. Audience validation if GOOGLE_CLIENT_ID is configured
    if settings.GOOGLE_CLIENT_ID and payload.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google token audience does not match configured Client ID"
        )

    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account did not provide an email address"
        )

    # Ensure email is verified
    email_verified = payload.get("email_verified")
    if email_verified is False or str(email_verified).lower() == "false":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Google account email is not verified"
        )

    # Ensure table columns exist safely (idempotent schema upgrade)
    from sqlalchemy import text
    try:
        await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;"))
        await db.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';"))
        await db.commit()
    except Exception:
        await db.rollback()

    # 3. Lookup user or auto-register new seeker
    try:
        stmt = select(User).where(User.email == email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()

        now = datetime.utcnow()
        name = payload.get("name") or email.split("@")[0]
        picture = payload.get("picture")

        admin_emails = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",") if e.strip()]
        is_admin_email = email.lower() in admin_emails

        if user:
            if not user.is_active:
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Inactive user account")
            if is_admin_email and getattr(user, "role", "user") != "admin":
                user.role = "admin"
            if hasattr(user, "avatar_url") and not user.avatar_url and picture:
                user.avatar_url = picture
            if not user.name:
                user.name = name
            user.last_login_at = now
            await db.commit()
            await db.refresh(user)
        else:
            # Auto-register new seeker
            user = User(
                email=email,
                name=name,
                password_hash=get_password_hash(secrets.token_urlsafe(32)),
                avatar_url=picture,
                role="admin" if is_admin_email else "user",
                is_active=True,
                last_login_at=now
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # 4. Generate access token
        access_token = create_access_token(subject=str(user.id))

        # 5. Set HttpOnly cookie
        response.set_cookie(
            key="access_token",
            value=f"Bearer {access_token}",
            httponly=True,
            samesite="none",
            secure=True,
            max_age=7 * 24 * 60 * 60, # 7 days
        )

        return {
            "message": "Successfully authenticated with Google",
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "role": getattr(user, "role", "user"),
                "avatar_url": getattr(user, "avatar_url", None)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database authentication error: {str(e)}"
        )

@router.post("/logout")
async def logout(response: Response):
    # Clear the HttpOnly cookie
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="none",
        secure=True,
    )
    return {"message": "Successfully logged out"}

@router.get("/account/export")
async def export_user_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generates a downloadable JSON export of user profile, conversations, messages, and memories."""
    # Fetch conversations with messages
    stmt = select(User).where(User.id == current_user.id)
    user_res = (await db.execute(stmt)).scalar_one()

    from app.models.domain import Conversation, Message, Memory, UserPreference
    from sqlalchemy.orm import selectinload

    conv_stmt = select(Conversation).where(Conversation.user_id == current_user.id).options(selectinload(Conversation.messages)).order_by(Conversation.created_at.desc())
    convs = (await db.execute(conv_stmt)).scalars().all()

    conv_list = []
    for c in convs:
        conv_list.append({
            "id": str(c.id),
            "title": c.title,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "messages": [
                {
                    "id": str(m.id),
                    "role": m.role,
                    "content": m.content,
                    "created_at": m.created_at.isoformat() if m.created_at else None
                }
                for m in c.messages
            ]
        })

    mem_stmt = select(Memory).where(Memory.user_id == current_user.id, Memory.is_active == True)
    memories = (await db.execute(mem_stmt)).scalars().all()

    mem_list = []
    for m in memories:
        mem_list.append({
            "id": str(m.id),
            "type": m.type,
            "summary": m.summary,
            "content": m.content,
            "importance": m.importance,
            "created_at": m.created_at.isoformat() if m.created_at else None
        })

    pref_stmt = select(UserPreference).where(UserPreference.user_id == current_user.id)
    pref = (await db.execute(pref_stmt)).scalar_one_or_none()

    export_payload = {
        "export_metadata": {
            "exported_at": datetime.utcnow().isoformat(),
            "application": "GitaMitra Companion v1.0",
            "version": "1.0-production"
        },
        "user_profile": {
            "id": str(current_user.id),
            "name": current_user.name,
            "email": current_user.email,
            "avatar_url": getattr(current_user, "avatar_url", None),
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "preferences": pref.settings if pref else {},
        "conversations": conv_list,
        "memories": mem_list
    }

    return Response(
        content=str(export_payload).replace("'", '"'),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename=gitamitra_user_export_{current_user.id}.json"}
    )

@router.delete("/account")
async def delete_user_account(
    response: Response,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Permanently deletes the user account and cascades deletion across all personal conversations, messages, and memories."""
    # Delete user record (SQLAlchemy cascade deletes conversations, memories, preferences)
    await db.delete(current_user)
    await db.commit()

    # Clear auth cookie
    response.delete_cookie(
        key="access_token",
        httponly=True,
        samesite="none",
        secure=True,
    )
    return {"message": "Account and all associated personal data have been permanently deleted."}

@router.post("/profile-picture")
async def update_profile_picture(
    payload: ProfilePictureUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Updates the user's profile picture."""
    current_user.avatar_url = payload.avatar_url
    await db.commit()
    return {"message": "Profile picture updated successfully", "avatar_url": current_user.avatar_url}

@router.delete("/profile-picture")
async def delete_profile_picture(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Removes the user's profile picture."""
    current_user.avatar_url = None
    await db.commit()
    return {"message": "Profile picture removed successfully"}

