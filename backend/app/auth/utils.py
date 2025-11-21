"""
Authentication utilities for JWT token handling and password management
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Union
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import HTTPException, status
import os
import hashlib
from app.models.schemas import TokenData

# Security settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24  # 30 days

# Password hashing context with bcrypt configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12)


def _preprocess_password(password: str) -> str:
    """Preprocess password to handle bcrypt 72-byte limit"""
    # Convert to bytes
    password_bytes = password.encode("utf-8")

    # If password is longer than 72 bytes, use SHA-256 hash first
    if len(password_bytes) > 72:
        # Use SHA-256 to reduce long passwords to a fixed 64-character hex string
        password_hash = hashlib.sha256(password_bytes).hexdigest()
        return password_hash

    return password


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against its hash"""
    try:
        preprocessed_password = _preprocess_password(plain_password)
        return pwd_context.verify(preprocessed_password, hashed_password)
    except Exception as e:
        print(f"Password verification error: {e}")
        return False


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    try:
        preprocessed_password = _preprocess_password(password)
        return pwd_context.hash(preprocessed_password)
    except Exception as e:
        print(f"Password hashing error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password processing error",
        )


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def verify_token(token: str) -> TokenData:
    """Verify and decode JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        user_id: str = payload.get("user_id")

        if email is None or user_id is None:
            raise credentials_exception

        token_data = TokenData(email=email, user_id=user_id)
        return token_data

    except JWTError:
        raise credentials_exception


def get_token_expire_time() -> int:
    """Get token expiration time in seconds"""
    return ACCESS_TOKEN_EXPIRE_MINUTES * 60
