#!/usr/bin/env python3
"""
Database initialization and migration script for CMD Transparency Platform
Creates all tables and imports mock data into PostgreSQL
"""

import sys
import os
import asyncio
from pathlib import Path

# Add the parent directory to Python path to import app modules
sys.path.append(str(Path(__file__).parent.parent))

from sqlalchemy import create_engine
from app.database.config import Base, DATABASE_URL, database, ASYNC_DATABASE_URL
from app.database.models import (
    Project,
    CitizenReport,
    Ministry,
    ProjectStatistics,
    UploadedImage,
)
from app.data.mock_data import mock_projects, get_ministries
import json
from datetime import datetime


def create_tables():
    """Create all database tables"""
    print("Creating PostgreSQL database tables...")
    engine = create_engine(DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    print("✅ Database tables created successfully!")


async def import_mock_data():
    """Import mock data into the database"""
    print("Importing mock data...")

    await database.connect()

    try:
        # 1. Import ministries
        print("Importing ministries...")
        ministries_list = get_ministries()

        for ministry_name in ministries_list:
            query = """
                INSERT INTO ministries (name, created_at) 
                VALUES (:name, :created_at) 
                ON CONFLICT (name) DO NOTHING
            """
            await database.execute(
                query=query,
                values={"name": ministry_name, "created_at": datetime.now()},
            )

        print(f"✅ Imported {len(ministries_list)} ministries")

        # 2. Import projects
        print("Importing projects...")

        for project_data in mock_projects:
            # Insert project (ON CONFLICT for PostgreSQL instead of INSERT OR REPLACE)
            query = """
                INSERT INTO projects 
                (id, fiscal_year, ministry, budget_subtitle, procurement_plan, 
                 signatures, status, progress_percentage, location, created_at, updated_at) 
                VALUES (:id, :fiscal_year, :ministry, :budget_subtitle, :procurement_plan,
                        :signatures, :status, :progress_percentage, :location, :created_at, :updated_at)
                ON CONFLICT (id) DO UPDATE SET
                    fiscal_year = EXCLUDED.fiscal_year,
                    ministry = EXCLUDED.ministry,
                    budget_subtitle = EXCLUDED.budget_subtitle,
                    procurement_plan = EXCLUDED.procurement_plan,
                    signatures = EXCLUDED.signatures,
                    status = EXCLUDED.status,
                    progress_percentage = EXCLUDED.progress_percentage,
                    location = EXCLUDED.location,
                    updated_at = EXCLUDED.updated_at
            """

            await database.execute(
                query=query,
                values={
                    "id": project_data["id"],
                    "fiscal_year": project_data["fiscal_year"],
                    "ministry": project_data["ministry"],
                    "budget_subtitle": project_data["budget_subtitle"],
                    "procurement_plan": json.dumps(project_data["procurement_plan"]),
                    "signatures": json.dumps(project_data.get("signatures")),
                    "status": project_data["status"],
                    "progress_percentage": project_data["progress_percentage"],
                    "location": json.dumps(project_data.get("location")),
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                },
            )

            # 3. Import citizen reports for this project
            citizen_reports = project_data.get("citizen_reports", [])
            for i, report in enumerate(citizen_reports):
                # Generate review_id if not present
                review_id = report.get(
                    "review_id", f"REV-{project_data['id']}-{i+1:03d}"
                )

                query = """
                    INSERT INTO citizen_reports 
                    (review_id, project_id, reporter_name, reporter_contact, review_type,
                     review_text, work_completed, quality_rating, geolocation, photo_urls,
                     verified, created_at, updated_at) 
                    VALUES (:review_id, :project_id, :reporter_name, :reporter_contact, :review_type,
                            :review_text, :work_completed, :quality_rating, :geolocation, :photo_urls,
                            :verified, :created_at, :updated_at)
                    ON CONFLICT (review_id) DO UPDATE SET
                        reporter_name = EXCLUDED.reporter_name,
                        reporter_contact = EXCLUDED.reporter_contact,
                        review_type = EXCLUDED.review_type,
                        review_text = EXCLUDED.review_text,
                        work_completed = EXCLUDED.work_completed,
                        quality_rating = EXCLUDED.quality_rating,
                        geolocation = EXCLUDED.geolocation,
                        photo_urls = EXCLUDED.photo_urls,
                        verified = EXCLUDED.verified,
                        updated_at = EXCLUDED.updated_at
                """

                # Parse timestamp properly
                timestamp_str = report.get("timestamp", datetime.now().isoformat())
                try:
                    if timestamp_str.endswith("Z"):
                        timestamp_str = timestamp_str[:-1] + "+00:00"
                    created_at = datetime.fromisoformat(
                        timestamp_str.replace("Z", "+00:00")
                    )
                except:
                    created_at = datetime.now()

                await database.execute(
                    query=query,
                    values={
                        "review_id": review_id,
                        "project_id": project_data["id"],
                        "reporter_name": report.get("reporter_name"),
                        "reporter_contact": report.get("reporter_contact"),
                        "review_type": report.get("review_type", "Progress Update"),
                        "review_text": report.get("report_text", ""),
                        "work_completed": report.get("work_completed", False),
                        "quality_rating": report.get("quality_rating"),
                        "geolocation": json.dumps(report.get("geolocation")),
                        "photo_urls": json.dumps(report.get("photo_urls", [])),
                        "verified": report.get("verified", False),
                        "created_at": created_at,
                        "updated_at": datetime.now(),
                    },
                )

        print(f"✅ Imported {len(mock_projects)} projects with their citizen reports")

        # 4. Calculate and insert project statistics
        print("Calculating project statistics...")

        for project_data in mock_projects:
            project_id = project_data["id"]
            reports = project_data.get("citizen_reports", [])

            # Calculate statistics
            total_reviews = len(reports)
            work_completed_count = sum(
                1 for r in reports if r.get("work_completed", False)
            )
            work_completed_percentage = (
                (work_completed_count / total_reviews * 100) if total_reviews > 0 else 0
            )

            ratings = [
                r.get("quality_rating") for r in reports if r.get("quality_rating")
            ]
            avg_rating = sum(ratings) / len(ratings) if ratings else None

            reviews_with_images = sum(1 for r in reports if r.get("photo_urls"))
            verified_reviews = sum(1 for r in reports if r.get("verified", False))

            # Count review types
            review_type_counts = {
                "progress_updates": 0,
                "quality_issues": 0,
                "completion_verifications": 0,
                "delay_reports": 0,
                "fraud_alerts": 0,
            }

            for report in reports:
                review_type = (
                    report.get("review_type", "Progress Update")
                    .lower()
                    .replace(" ", "_")
                )
                if review_type in review_type_counts:
                    review_type_counts[review_type] += 1

            # Insert statistics (PostgreSQL style)
            query = """
                INSERT INTO project_statistics 
                (project_id, total_reviews, work_completed_percentage, average_quality_rating,
                 reviews_with_images, verified_reviews, progress_updates, quality_issues,
                 completion_verifications, delay_reports, fraud_alerts, last_calculated) 
                VALUES (:project_id, :total_reviews, :work_completed_percentage, :average_quality_rating,
                        :reviews_with_images, :verified_reviews, :progress_updates, :quality_issues,
                        :completion_verifications, :delay_reports, :fraud_alerts, :last_calculated)
                ON CONFLICT (project_id) DO UPDATE SET
                    total_reviews = EXCLUDED.total_reviews,
                    work_completed_percentage = EXCLUDED.work_completed_percentage,
                    average_quality_rating = EXCLUDED.average_quality_rating,
                    reviews_with_images = EXCLUDED.reviews_with_images,
                    verified_reviews = EXCLUDED.verified_reviews,
                    progress_updates = EXCLUDED.progress_updates,
                    quality_issues = EXCLUDED.quality_issues,
                    completion_verifications = EXCLUDED.completion_verifications,
                    delay_reports = EXCLUDED.delay_reports,
                    fraud_alerts = EXCLUDED.fraud_alerts,
                    last_calculated = EXCLUDED.last_calculated
            """

            await database.execute(
                query=query,
                values={
                    "project_id": project_id,
                    "total_reviews": total_reviews,
                    "work_completed_percentage": work_completed_percentage,
                    "average_quality_rating": avg_rating,
                    "reviews_with_images": reviews_with_images,
                    "verified_reviews": verified_reviews,
                    "progress_updates": review_type_counts["progress_updates"],
                    "quality_issues": review_type_counts["quality_issues"],
                    "completion_verifications": review_type_counts[
                        "completion_verifications"
                    ],
                    "delay_reports": review_type_counts["delay_reports"],
                    "fraud_alerts": review_type_counts["fraud_alerts"],
                    "last_calculated": datetime.now(),
                },
            )

        print(f"✅ Calculated statistics for {len(mock_projects)} projects")

        print("\n🎉 Mock data import completed successfully!")
        print(f"📊 Database Summary:")
        print(f"   - {len(ministries_list)} ministries")
        print(f"   - {len(mock_projects)} projects")

        total_reports = sum(len(p.get("citizen_reports", [])) for p in mock_projects)
        print(f"   - {total_reports} citizen reports")

    except Exception as e:
        print(f"❌ Error importing data: {e}")
        raise
    finally:
        await database.disconnect()


async def verify_import():
    """Verify that data was imported correctly"""
    print("\nVerifying data import...")

    await database.connect()

    try:
        # Check projects count
        projects_count = await database.fetch_val("SELECT COUNT(*) FROM projects")
        print(f"📊 Projects in database: {projects_count}")

        # Check reports count
        reports_count = await database.fetch_val("SELECT COUNT(*) FROM citizen_reports")
        print(f"📝 Citizen reports in database: {reports_count}")

        # Check ministries count
        ministries_count = await database.fetch_val("SELECT COUNT(*) FROM ministries")
        print(f"🏛️  Ministries in database: {ministries_count}")

        # Show sample project
        sample_project = await database.fetch_one(
            "SELECT id, ministry, status, progress_percentage FROM projects LIMIT 1"
        )
        if sample_project:
            print(f"\n📋 Sample project:")
            print(f"   ID: {sample_project['id']}")
            print(f"   Ministry: {sample_project['ministry']}")
            print(f"   Status: {sample_project['status']}")
            print(f"   Progress: {sample_project['progress_percentage']}%")

        print("✅ Data verification completed!")

    except Exception as e:
        print(f"❌ Error verifying data: {e}")
    finally:
        await database.disconnect()


async def main():
    """Main migration function"""
    print("🚀 Starting E-निरीक्षण Database Migration")
    print("=" * 50)

    try:
        # Step 1: Create tables
        create_tables()

        # Step 2: Import mock data
        await import_mock_data()

        # Step 3: Verify import
        await verify_import()

        print("\n" + "=" * 50)
        print("✅ Database migration completed successfully!")
        print("🌐 You can now start the API server:")
        print("   python -m uvicorn app.main:app --reload")

    except Exception as e:
        print(f"\n❌ Migration failed: {e}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
