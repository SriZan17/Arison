#!/usr/bin/env python3
"""
Quick debug script to test the authentication system and identify the issue
"""

import sys
import os

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.auth.service_db import authenticate_user, get_user_by_email
from app.database.config import SessionLocal
from app.database.models import User


def test_auth_debug():
    print("🔍 Debugging Authentication System")
    print("=" * 50)

    # Test 1: Database connection
    print("\n1. Testing database connection...")
    try:
        with SessionLocal() as session:
            user_count = session.query(User).count()
            print(f"✅ Database connected successfully! Found {user_count} users")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return

    # Test 2: Check if demo user exists
    print("\n2. Testing user retrieval...")
    try:
        user = get_user_by_email("citizen@example.com")
        if user:
            print(f"✅ Found user: {user.name} ({user.email})")
        else:
            print("❌ Demo user not found")
            return
    except Exception as e:
        print(f"❌ User retrieval failed: {e}")
        return

    # Test 3: Test authentication
    print("\n3. Testing authentication...")
    try:
        auth_user = authenticate_user("citizen@example.com", "password123")
        if auth_user:
            print(f"✅ Authentication successful: {auth_user.name}")
        else:
            print("❌ Authentication failed - invalid credentials")
    except Exception as e:
        print(f"❌ Authentication error: {e}")
        return

    print("\n✅ All authentication tests passed!")
    print("The issue might be in the FastAPI route or request handling.")


if __name__ == "__main__":
    test_auth_debug()
