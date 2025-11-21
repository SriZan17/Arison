"""
Authentication dependencies for FastAPI
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from app.auth.utils import verify_token
from app.models.schemas import User, TokenData
from app.auth.service_db import get_user_by_id

# Security scheme
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> User:
    """
    Dependency to get the current authenticated user from JWT token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Verify the token
        token_data: TokenData = verify_token(credentials.credentials)

        # Get user from database
        user = get_user_by_id(token_data.user_id)
        if user is None:
            raise credentials_exception

        return user

    except Exception as e:
        print(f"Auth error: {e}")
        raise credentials_exception


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """
    Dependency to get current active user (can be extended for user status checks)
    """
    # In the future, you can add checks for user.is_active, user.is_verified, etc.
    return current_user


def get_admin_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure current user is an admin
    """
    if current_user.role not in ["admin", "official"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permissions"
        )
    return current_user


# Optional auth dependency (for endpoints that work with or without auth)
def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Optional[User]:
    """
    Optional authentication dependency - returns None if no valid token
    """
    if not credentials:
        return None

    try:
        token_data: TokenData = verify_token(credentials.credentials)
        user = get_user_by_id(token_data.user_id)
        return user
    except:
        return None
