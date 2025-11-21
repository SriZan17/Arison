#!/usr/bin/env python3
"""
Test authentication endpoints to verify database integration
"""

import requests
import json

BASE_URL = "http://127.0.0.1:8000"


def test_login():
    """Test login endpoint"""
    print("Testing login endpoint...")

    # Test with demo citizen account
    login_data = {"email": "citizen@example.com", "password": "password123"}

    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200:
        print("✅ Login test passed!")
        return response.json()["access_token"]
    else:
        print("❌ Login test failed!")
        return None


def test_demo_accounts():
    """Test demo accounts endpoint"""
    print("\nTesting demo accounts endpoint...")

    response = requests.get(f"{BASE_URL}/api/auth/demo-accounts")

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200:
        print("✅ Demo accounts test passed!")
    else:
        print("❌ Demo accounts test failed!")


def test_current_user(token):
    """Test current user endpoint"""
    if not token:
        print("❌ Skipping current user test - no token")
        return

    print("\nTesting current user endpoint...")

    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200:
        print("✅ Current user test passed!")
    else:
        print("❌ Current user test failed!")


def main():
    """Main test function"""
    print("🔐 Testing Authentication Backend with Database")
    print("=" * 50)

    # Test login and get token
    token = test_login()

    # Test demo accounts
    test_demo_accounts()

    # Test current user with token
    test_current_user(token)

    print("\n" + "=" * 50)
    if token:
        print("🎉 Authentication system is working with database!")
        print("\nDemo accounts:")
        print("- citizen@example.com / password123")
        print("- official@gov.np / admin123")
    else:
        print("❌ Authentication test failed")


if __name__ == "__main__":
    main()
