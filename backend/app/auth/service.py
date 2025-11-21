"""
Authentication service for user management
"""

from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.schemas import User, UserCreate, UserInDB, UserRole
from app.auth.utils import get_password_hash, verify_password
import uuid

# In-memory user storage (in production, this would be a database)
# This matches the frontend demo accounts with pre-computed hashes
USERS_DB: Dict[str, Dict[str, Any]] = {
    "user_1": {
        "id": "user_1",
        "name": "Demo Citizen",
        "email": "citizen@example.com",
        "phone": "+977-9841234567",
        "role": "citizen",
        "verified": True,
        # Pre-computed hash for "password123"
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewtwPSdyqJ/wCOJi",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
    },
    "user_2": {
        "id": "user_2",
        "name": "Government Official",
        "email": "official@gov.np",
        "phone": "+977-9851234567",
        "role": "official",
        "verified": True,
        # Pre-computed hash for "admin123"
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPjiyjA4a",
        "created_at": "2024-01-01T00:00:00Z",
        "last_login": None,
    },
}


async def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get user by email address"""
    for user_data in USERS_DB.values():
        if user_data["email"] == email:
            return UserInDB(**user_data)
    return None


async def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID"""
    user_data = USERS_DB.get(user_id)
    if user_data:
        # Return User without hashed_password
        user_dict = user_data.copy()
        user_dict.pop("hashed_password", None)
        user_dict["created_at"] = datetime.fromisoformat(
            user_dict["created_at"].replace("Z", "+00:00")
        )
        if user_dict["last_login"]:
            user_dict["last_login"] = datetime.fromisoformat(
                user_dict["last_login"].replace("Z", "+00:00")
            )
        return User(**user_dict)
    return None


async def create_user(user_create: UserCreate) -> Optional[User]:
    """Create a new user"""
    # Check if user already exists
    existing_user = await get_user_by_email(user_create.email)
    if existing_user:
        return None

    # Validate password confirmation
    if user_create.password != user_create.confirm_password:
        return None

    # Generate user ID
    user_id = f"user_{len(USERS_DB) + 1}_{uuid.uuid4().hex[:8]}"

    # Create user data
    now = datetime.now().isoformat() + "Z"
    user_data = {
        "id": user_id,
        "name": user_create.name,
        "email": user_create.email,
        "phone": user_create.phone,
        "role": user_create.role,
        "verified": False,  # New users need verification
        "hashed_password": get_password_hash(user_create.password),
        "created_at": now,
        "last_login": None,
    }

    # Store user
    USERS_DB[user_id] = user_data

    # Return user without hashed password
    return await get_user_by_id(user_id)


async def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with email and password"""
    user = await get_user_by_email(email)
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    # Update last login
    USERS_DB[user.id]["last_login"] = datetime.now().isoformat() + "Z"

    return user


async def update_user_last_login(user_id: str) -> None:
    """Update user's last login timestamp"""
    if user_id in USERS_DB:
        USERS_DB[user_id]["last_login"] = datetime.now().isoformat() + "Z"


async def get_all_users() -> List[User]:
    """Get all users (admin only)"""
    users = []
    for user_data in USERS_DB.values():
        user_dict = user_data.copy()
        user_dict.pop("hashed_password", None)
        user_dict["created_at"] = datetime.fromisoformat(
            user_dict["created_at"].replace("Z", "+00:00")
        )
        if user_dict["last_login"]:
            user_dict["last_login"] = datetime.fromisoformat(
                user_dict["last_login"].replace("Z", "+00:00")
            )
        users.append(User(**user_dict))
    return users


async def verify_user(user_id: str) -> Optional[User]:
    """Verify a user account (admin only)"""
    if user_id in USERS_DB:
        USERS_DB[user_id]["verified"] = True
        return await get_user_by_id(user_id)
    return None
