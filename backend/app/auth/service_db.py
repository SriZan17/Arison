"""
Database-based authentication service for user management
"""

from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
import uuid

from app.database.config import SessionLocal
from app.database.models import User as UserModel, UserRole
from app.models.schemas import User, UserCreate, UserInDB
from app.auth.utils import get_password_hash, verify_password


"""
Database-based authentication service for user management
"""

from typing import Optional, List
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select
import uuid

from app.database.config import SessionLocal
from app.database.models import User as UserModel, UserRole
from app.models.schemas import User, UserCreate, UserInDB
from app.auth.utils import get_password_hash, verify_password


def get_user_by_email(email: str) -> Optional[UserInDB]:
    """Get user by email address"""
    with SessionLocal() as session:
        user_model = session.query(UserModel).filter(UserModel.email == email).first()

        if user_model:
            return UserInDB(
                id=user_model.id,
                name=user_model.name,
                email=user_model.email,
                phone=user_model.phone,
                role=user_model.role.value,
                verified=user_model.verified,
                created_at=user_model.created_at,
                last_login=user_model.last_login,
                hashed_password=user_model.hashed_password,
            )
        return None


def get_user_by_id(user_id: str) -> Optional[User]:
    """Get user by ID"""
    with SessionLocal() as session:
        user_model = session.query(UserModel).filter(UserModel.id == user_id).first()

        if user_model:
            return User(
                id=user_model.id,
                name=user_model.name,
                email=user_model.email,
                phone=user_model.phone,
                role=user_model.role.value,
                verified=user_model.verified,
                created_at=user_model.created_at,
                last_login=user_model.last_login,
            )
        return None


def create_user(user_create: UserCreate) -> Optional[User]:
    """Create a new user"""
    # Check if user already exists
    existing_user = get_user_by_email(user_create.email)
    if existing_user:
        return None

    # Validate password confirmation
    if user_create.password != user_create.confirm_password:
        return None

    # Generate user ID
    user_id = f"user_{uuid.uuid4().hex[:8]}"

    with SessionLocal() as session:
        # Create user model
        user_model = UserModel(
            id=user_id,
            name=user_create.name,
            email=user_create.email,
            phone=user_create.phone,
            hashed_password=get_password_hash(user_create.password),
            role=UserRole(user_create.role),
            verified=False,  # New users need verification
        )

        session.add(user_model)
        session.commit()
        session.refresh(user_model)

        return User(
            id=user_model.id,
            name=user_model.name,
            email=user_model.email,
            phone=user_model.phone,
            role=user_model.role.value,
            verified=user_model.verified,
            created_at=user_model.created_at,
            last_login=user_model.last_login,
        )


def authenticate_user(email: str, password: str) -> Optional[UserInDB]:
    """Authenticate user with email and password"""
    user = get_user_by_email(email)
    if not user:
        return None

    if not verify_password(password, user.hashed_password):
        return None

    # Update last login
    update_user_last_login(user.id)

    return user


def update_user_last_login(user_id: str) -> None:
    """Update user's last login timestamp"""
    with SessionLocal() as session:
        user_model = session.query(UserModel).filter(UserModel.id == user_id).first()

        if user_model:
            user_model.last_login = datetime.now(timezone.utc)
            session.commit()


def get_all_users() -> List[User]:
    """Get all users (admin only)"""
    with SessionLocal() as session:
        user_models = session.query(UserModel).all()

        return [
            User(
                id=user_model.id,
                name=user_model.name,
                email=user_model.email,
                phone=user_model.phone,
                role=user_model.role.value,
                verified=user_model.verified,
                created_at=user_model.created_at,
                last_login=user_model.last_login,
            )
            for user_model in user_models
        ]


def verify_user(user_id: str) -> Optional[User]:
    """Verify a user account (admin only)"""
    with SessionLocal() as session:
        user_model = session.query(UserModel).filter(UserModel.id == user_id).first()

        if user_model:
            user_model.verified = True
            session.commit()
            session.refresh(user_model)

            return User(
                id=user_model.id,
                name=user_model.name,
                email=user_model.email,
                phone=user_model.phone,
                role=user_model.role.value,
                verified=user_model.verified,
                created_at=user_model.created_at,
                last_login=user_model.last_login,
            )
        return None


def create_demo_users():
    """Create demo users for testing"""
    demo_users = [
        {
            "id": "demo_citizen",
            "name": "Demo Citizen",
            "email": "citizen@example.com",
            "phone": "+977-9841234567",
            "password": "password123",
            "role": UserRole.CITIZEN,
            "verified": True,
        },
        {
            "id": "demo_official",
            "name": "Government Official",
            "email": "official@gov.np",
            "phone": "+977-9851234567",
            "password": "admin123",
            "role": UserRole.OFFICIAL,
            "verified": True,
        },
    ]

    with SessionLocal() as session:
        for demo_user in demo_users:
            # Check if user already exists
            existing_user = (
                session.query(UserModel)
                .filter(UserModel.email == demo_user["email"])
                .first()
            )

            if not existing_user:
                user_model = UserModel(
                    id=demo_user["id"],
                    name=demo_user["name"],
                    email=demo_user["email"],
                    phone=demo_user["phone"],
                    hashed_password=get_password_hash(demo_user["password"]),
                    role=demo_user["role"],
                    verified=demo_user["verified"],
                )
                session.add(user_model)

        session.commit()
