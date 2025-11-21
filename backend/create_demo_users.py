#!/usr/bin/env python3
"""
Create demo users for authentication testing
"""

import sys
import os
from pathlib import Path

# Add the parent directory to Python path to import app modules
sys.path.append(str(Path(__file__).parent))

from app.auth.service_db import create_demo_users


def main():
    """Create demo users"""
    print("Creating demo users...")
    try:
        create_demo_users()
        print("✅ Demo users created successfully!")
        print("📧 Demo accounts:")
        print("   - Citizen: citizen@example.com / password123")
        print("   - Official: official@gov.np / admin123")
    except Exception as e:
        print(f"❌ Error creating demo users: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
