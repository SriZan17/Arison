"""
Create users table and add demo users to the database
"""

import sys
import os

# Add the parent directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database.config import engine, Base, SessionLocal
from app.database.models import User, UserRole
from app.auth.utils import get_password_hash


def create_tables():
    """Create all tables in the database"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")


def create_demo_users():
    """Create demo users for testing"""
    print("Creating demo users...")

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
                session.query(User).filter(User.email == demo_user["email"]).first()
            )

            if not existing_user:
                user = User(
                    id=demo_user["id"],
                    name=demo_user["name"],
                    email=demo_user["email"],
                    phone=demo_user["phone"],
                    hashed_password=get_password_hash(demo_user["password"]),
                    role=demo_user["role"],
                    verified=demo_user["verified"],
                )
                session.add(user)
                print(f"Created user: {demo_user['email']}")
            else:
                print(f"User already exists: {demo_user['email']}")

        session.commit()

    print("Demo users created successfully!")


def main():
    """Main migration function"""
    try:
        # Create tables first
        create_tables()

        # Then create demo users
        create_demo_users()

        print("\nMigration completed successfully!")
        print("You can now login with:")
        print("- citizen@example.com / password123 (Citizen role)")
        print("- official@gov.np / admin123 (Official role)")

    except Exception as e:
        print(f"Migration failed: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
