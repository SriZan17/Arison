"""
Authentication router for user registration, login, and user management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from datetime import timedelta
from typing import List

from app.models.schemas import UserCreate, UserLogin, Token, User, UserInDB
from app.auth.service import (
    create_user,
    authenticate_user,
    get_all_users,
    verify_user,
    update_user_last_login,
)
from app.auth.utils import (
    create_access_token,
    get_token_expire_time,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from app.auth.dependencies import (
    get_current_user,
    get_current_active_user,
    get_admin_user,
)

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
    responses={404: {"description": "Not found"}},
)


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register_user(user_create: UserCreate):
    """
    Register a new user account
    """
    # Validate password confirmation
    if user_create.password != user_create.confirm_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Passwords do not match"
        )

    # Create user
    user = await create_user(user_create)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )

    # Update last login
    await update_user_last_login(user.id)

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expire_time(),
        user=user,
    )


@router.post("/login", response_model=Token)
async def login_user(user_login: UserLogin):
    """
    User login with email and password
    """
    # Authenticate user
    user = await authenticate_user(user_login.email, user_login.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "user_id": user.id}, expires_delta=access_token_expires
    )

    # Convert UserInDB to User for response
    user_response = User(
        id=user.id,
        name=user.name,
        email=user.email,
        phone=user.phone,
        role=user.role,
        verified=user.verified,
        created_at=user.created_at,
        last_login=user.last_login,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expire_time(),
        user=user_response,
    )


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """
    Get current user information
    """
    return current_user


@router.post("/refresh", response_model=Token)
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """
    Refresh access token for authenticated user
    """
    # Create new access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.email, "user_id": current_user.id},
        expires_delta=access_token_expires,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=get_token_expire_time(),
        user=current_user,
    )


# Admin routes
@router.get("/users", response_model=List[User])
async def get_users(admin_user: User = Depends(get_admin_user)):
    """
    Get all users (admin/official only)
    """
    return await get_all_users()


@router.post("/users/{user_id}/verify", response_model=User)
async def verify_user_account(user_id: str, admin_user: User = Depends(get_admin_user)):
    """
    Verify a user account (admin/official only)
    """
    user = await verify_user(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return user


@router.get("/demo-accounts")
async def get_demo_accounts():
    """
    Get demo account credentials for testing
    """
    return {
        "message": "Demo accounts for E-निरीक्षण testing",
        "accounts": [
            {
                "role": "citizen",
                "email": "citizen@example.com",
                "password": "password123",
                "description": "Demo citizen account for testing reports and reviews",
            },
            {
                "role": "official",
                "email": "official@gov.np",
                "password": "admin123",
                "description": "Demo government official account with admin privileges",
            },
        ],
        "usage": "Use these accounts to test the authentication system",
    }
