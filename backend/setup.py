#!/usr/bin/env python3
"""
Complete setup script for CMD Transparency Platform with PostgreSQL
Installs dependencies, sets up database, and imports mock data
"""

import subprocess
import sys
import os
import asyncio
from pathlib import Path


def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n🔄 {description}...")
    try:
        result = subprocess.run(
            command, shell=True, check=True, capture_output=True, text=True
        )
        print(f"✅ {description} completed successfully!")
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {description} failed!")
        print(f"Error: {e}")
        if e.stdout:
            print(f"Output: {e.stdout}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False


def check_postgresql():
    """Check if PostgreSQL is running"""
    print("\n🔍 Checking PostgreSQL connection...")
    try:
        import psycopg2

        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            database="postgres",  # Connect to default database first
        )
        conn.close()
        print("✅ PostgreSQL connection successful!")
        return True
    except Exception as e:
        print(f"❌ PostgreSQL connection failed: {e}")
        print("\n📋 Please ensure:")
        print("1. PostgreSQL is installed and running")
        print("2. Update .env file with correct credentials")
        print("3. Database user has necessary privileges")
        return False


def create_database():
    """Create the database if it doesn't exist"""
    print("\n🔄 Creating database...")
    try:
        import psycopg2
        from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

        # Connect to PostgreSQL server
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", "password"),
            database="postgres",
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Check if database exists
        db_name = os.getenv("DB_NAME", "cmd_transparency")
        cursor.execute(f"SELECT 1 FROM pg_database WHERE datname='{db_name}'")
        exists = cursor.fetchone()

        if not exists:
            cursor.execute(f"CREATE DATABASE {db_name}")
            print(f"✅ Database '{db_name}' created successfully!")
        else:
            print(f"✅ Database '{db_name}' already exists!")

        cursor.close()
        conn.close()
        return True

    except Exception as e:
        print(f"❌ Database creation failed: {e}")
        return False


async def main():
    """Main setup function"""
    print("🚀 CMD Transparency Platform Setup")
    print("=" * 50)

    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("📝 Creating .env file from template...")
        example_env = Path(".env.example")
        if example_env.exists():
            import shutil

            shutil.copy(".env.example", ".env")
            print(
                "✅ .env file created! Please update it with your PostgreSQL credentials."
            )
            print(
                "\n⚠️  Please edit the .env file with your database credentials and run this script again."
            )
            return
        else:
            print("❌ .env.example not found. Please create a .env file manually.")
            return

    # Load environment variables
    try:
        from dotenv import load_dotenv

        load_dotenv()
        print("✅ Environment variables loaded!")
    except ImportError:
        print("📦 Installing python-dotenv...")
        run_command("pip install python-dotenv", "Installing python-dotenv")
        from dotenv import load_dotenv

        load_dotenv()

    # Step 1: Install Python dependencies
    print("\n📦 Installing Python dependencies...")
    dependencies = [
        "fastapi",
        "uvicorn[standard]",
        "sqlalchemy",
        "alembic",
        "psycopg2-binary",
        "asyncpg",
        "databases[postgresql]",
        "aiofiles",
        "python-multipart",
        "pydantic",
        "requests",
        "python-dotenv",
    ]

    for dep in dependencies:
        success = run_command(f"pip install {dep}", f"Installing {dep}")
        if not success:
            print(f"❌ Failed to install {dep}. Please install manually.")
            return

    # Step 2: Check PostgreSQL connection
    if not check_postgresql():
        print("\n📋 PostgreSQL Setup Instructions:")
        print("1. Install PostgreSQL from https://www.postgresql.org/download/")
        print("2. Start PostgreSQL service")
        print("3. Update .env file with correct credentials")
        print("4. Run this script again")
        return

    # Step 3: Create database
    if not create_database():
        print("❌ Database setup failed. Please check your PostgreSQL configuration.")
        return

    # Step 4: Run database migrations
    print("\n🔄 Running database migrations...")
    try:
        # Import and run migration
        from migrate_database import main as migrate_main

        await migrate_main()
        print("✅ Database migration completed!")
    except Exception as e:
        print(f"❌ Database migration failed: {e}")
        return

    # Step 5: Verify setup
    print("\n🔍 Verifying setup...")
    try:
        from app.database.config import database

        await database.connect()

        # Check if tables exist and have data
        projects_count = await database.fetch_val("SELECT COUNT(*) FROM projects")
        reports_count = await database.fetch_val("SELECT COUNT(*) FROM citizen_reports")

        await database.disconnect()

        print(f"✅ Setup verification successful!")
        print(f"   📊 Projects: {projects_count}")
        print(f"   📝 Reports: {reports_count}")

    except Exception as e:
        print(f"❌ Setup verification failed: {e}")
        return

    # Success!
    print("\n" + "=" * 50)
    print("🎉 CMD Transparency Platform setup completed successfully!")
    print("\n🚀 Next steps:")
    print("1. Start the API server:")
    print("   python -m uvicorn app.main:app --reload")
    print("\n2. Visit the API documentation:")
    print("   http://localhost:8000/docs")
    print("\n3. Test the API:")
    print("   python test_api.py")
    print("\n📖 Database info:")
    print("   - PostgreSQL database with imported mock data")
    print("   - 6 government projects with citizen reports")
    print("   - Statistics and analytics ready")


if __name__ == "__main__":
    asyncio.run(main())
