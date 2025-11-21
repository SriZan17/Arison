"""
Database service layer for CMD Transparency Platform
Handles all database operations using async/await pattern
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, text
from app.database.config import database
from app.database.models import Project, CitizenReport, Ministry, ProjectStatistics
import json
from datetime import datetime


class DatabaseService:
    """Service layer for database operations"""

    @staticmethod
    async def get_all_projects(
        ministry: Optional[str] = None,
        status: Optional[str] = None,
        fiscal_year: Optional[str] = None,
        min_amount: Optional[float] = None,
        max_amount: Optional[float] = None,
        search: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[Dict[Any, Any]]:
        """Get all projects with optional filters"""

        query = """
            SELECT p.*, COALESCE(ps.total_reviews, 0) as review_count
            FROM projects p
            LEFT JOIN project_statistics ps ON p.id = ps.project_id
            WHERE 1=1
        """
        values = {}

        if ministry:
            query += " AND p.ministry ILIKE :ministry"
            values["ministry"] = f"%{ministry}%"

        if status:
            query += " AND p.status = :status"
            values["status"] = status

        if fiscal_year:
            query += " AND p.fiscal_year = :fiscal_year"
            values["fiscal_year"] = fiscal_year

        if min_amount or max_amount:
            # Use JSON extraction for contract amount
            if min_amount:
                query += " AND CAST(p.procurement_plan->>'contract_amount' AS FLOAT) >= :min_amount"
                values["min_amount"] = min_amount
            if max_amount:
                query += " AND CAST(p.procurement_plan->>'contract_amount' AS FLOAT) <= :max_amount"
                values["max_amount"] = max_amount

        if search:
            query += """ AND (
                p.ministry ILIKE :search 
                OR p.procurement_plan->>'details_of_work' ILIKE :search
                OR p.procurement_plan->>'contractor_name' ILIKE :search
            )"""
            values["search"] = f"%{search}%"

        query += " ORDER BY p.created_at DESC LIMIT :limit OFFSET :offset"
        values["limit"] = limit
        values["offset"] = offset

        rows = await database.fetch_all(query=query, values=values)

        # Convert to project format
        projects = []
        for row in rows:
            project = {
                "id": row["id"],
                "fiscal_year": row["fiscal_year"],
                "ministry": row["ministry"],
                "budget_subtitle": row["budget_subtitle"],
                "procurement_plan": (
                    json.loads(row["procurement_plan"])
                    if row["procurement_plan"]
                    else {}
                ),
                "signatures": (
                    json.loads(row["signatures"]) if row["signatures"] else None
                ),
                "status": row["status"],
                "progress_percentage": row["progress_percentage"],
                "location": json.loads(row["location"]) if row["location"] else None,
                "citizen_reports_count": row["review_count"] or 0,
            }
            projects.append(project)

        return projects

    @staticmethod
    async def get_project_by_id(project_id: str) -> Optional[Dict[Any, Any]]:
        """Get a single project by ID with its citizen reports"""

        # Get project
        query = "SELECT * FROM projects WHERE id = :project_id"
        project_row = await database.fetch_one(
            query=query, values={"project_id": project_id}
        )

        if not project_row:
            return None

        # Get citizen reports
        reports_query = """
            SELECT * FROM citizen_reports 
            WHERE project_id = :project_id 
            ORDER BY created_at DESC
        """
        reports_rows = await database.fetch_all(
            query=reports_query, values={"project_id": project_id}
        )

        # Format citizen reports
        citizen_reports = []
        for report_row in reports_rows:
            report = {
                "review_id": report_row["review_id"],
                "reporter_name": report_row["reporter_name"],
                "reporter_contact": report_row["reporter_contact"],
                "review_type": report_row["review_type"],
                "report_text": report_row["review_text"],
                "work_completed": report_row["work_completed"],
                "quality_rating": report_row["quality_rating"],
                "geolocation": (
                    json.loads(report_row["geolocation"])
                    if report_row["geolocation"]
                    else None
                ),
                "photo_urls": (
                    json.loads(report_row["photo_urls"])
                    if report_row["photo_urls"]
                    else []
                ),
                "verified": report_row["verified"],
                "timestamp": report_row["created_at"].isoformat(),
            }
            citizen_reports.append(report)

        # Format project
        project = {
            "id": project_row["id"],
            "fiscal_year": project_row["fiscal_year"],
            "ministry": project_row["ministry"],
            "budget_subtitle": project_row["budget_subtitle"],
            "procurement_plan": (
                json.loads(project_row["procurement_plan"])
                if project_row["procurement_plan"]
                else {}
            ),
            "signatures": (
                json.loads(project_row["signatures"])
                if project_row["signatures"]
                else None
            ),
            "status": project_row["status"],
            "progress_percentage": project_row["progress_percentage"],
            "location": (
                json.loads(project_row["location"]) if project_row["location"] else None
            ),
            "citizen_reports": citizen_reports,
        }

        return project

    @staticmethod
    async def create_citizen_report(
        review_id: str,
        project_id: str,
        reporter_name: Optional[str],
        reporter_contact: Optional[str],
        review_type: str,
        review_text: str,
        work_completed: bool,
        quality_rating: Optional[int],
        geolocation: Optional[dict],
        photo_urls: List[str],
    ) -> Dict[Any, Any]:
        """Create a new citizen report"""

        query = """
            INSERT INTO citizen_reports 
            (review_id, project_id, reporter_name, reporter_contact, review_type,
             review_text, work_completed, quality_rating, geolocation, photo_urls,
             verified, created_at, updated_at) 
            VALUES (:review_id, :project_id, :reporter_name, :reporter_contact, :review_type,
                    :review_text, :work_completed, :quality_rating, :geolocation, :photo_urls,
                    :verified, :created_at, :updated_at)
            RETURNING *
        """

        values = {
            "review_id": review_id,
            "project_id": project_id,
            "reporter_name": reporter_name,
            "reporter_contact": reporter_contact,
            "review_type": review_type,
            "review_text": review_text,
            "work_completed": work_completed,
            "quality_rating": quality_rating,
            "geolocation": json.dumps(geolocation) if geolocation else None,
            "photo_urls": json.dumps(photo_urls),
            "verified": False,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        report_row = await database.fetch_one(query=query, values=values)

        if not report_row:
            raise Exception("Failed to create citizen report")

        # Update project statistics
        await DatabaseService.recalculate_project_statistics(project_id)

        # Format response
        report = {
            "review_id": report_row["review_id"],
            "reporter_name": report_row["reporter_name"],
            "reporter_contact": report_row["reporter_contact"],
            "review_type": report_row["review_type"],
            "review_text": report_row["review_text"],
            "work_completed": report_row["work_completed"],
            "quality_rating": report_row["quality_rating"],
            "geolocation": (
                json.loads(report_row["geolocation"])
                if report_row["geolocation"]
                else None
            ),
            "photo_urls": (
                json.loads(report_row["photo_urls"]) if report_row["photo_urls"] else []
            ),
            "verified": report_row["verified"],
            "timestamp": report_row["created_at"].isoformat(),
        }

        return report

    @staticmethod
    async def get_project_reports(project_id: str) -> List[Dict[Any, Any]]:
        """Get all reports for a project"""

        query = """
            SELECT * FROM citizen_reports 
            WHERE project_id = :project_id 
            ORDER BY created_at DESC
        """

        reports_rows = await database.fetch_all(
            query=query, values={"project_id": project_id}
        )

        reports = []
        for row in reports_rows:
            report = {
                "review_id": row["review_id"],
                "reporter_name": row["reporter_name"],
                "reporter_contact": row["reporter_contact"],
                "review_type": row["review_type"],
                "review_text": row["review_text"],
                "work_completed": row["work_completed"],
                "quality_rating": row["quality_rating"],
                "geolocation": (
                    json.loads(row["geolocation"]) if row["geolocation"] else None
                ),
                "photo_urls": (
                    json.loads(row["photo_urls"]) if row["photo_urls"] else []
                ),
                "verified": row["verified"],
                "timestamp": row["created_at"].isoformat(),
            }
            reports.append(report)

        return reports

    @staticmethod
    async def get_specific_review(
        project_id: str, review_id: str
    ) -> Optional[Dict[Any, Any]]:
        """Get a specific review by review_id and project_id"""

        query = """
            SELECT * FROM citizen_reports 
            WHERE project_id = :project_id AND review_id = :review_id
        """

        review_row = await database.fetch_one(
            query=query, values={"project_id": project_id, "review_id": review_id}
        )

        if not review_row:
            return None

        # Format review
        review = {
            "review_id": review_row["review_id"],
            "reporter_name": review_row["reporter_name"],
            "reporter_contact": review_row["reporter_contact"],
            "review_type": review_row["review_type"],
            "review_text": review_row["review_text"],
            "work_completed": review_row["work_completed"],
            "quality_rating": review_row["quality_rating"],
            "geolocation": (
                json.loads(review_row["geolocation"])
                if review_row["geolocation"]
                else None
            ),
            "photo_urls": (
                json.loads(review_row["photo_urls"]) if review_row["photo_urls"] else []
            ),
            "verified": review_row["verified"],
            "timestamp": review_row["created_at"].isoformat(),
        }

        return review

    @staticmethod
    async def get_project_statistics(project_id: str) -> Dict[Any, Any]:
        """Get statistics for a project"""

        query = "SELECT * FROM project_statistics WHERE project_id = :project_id"
        stats_row = await database.fetch_one(
            query=query, values={"project_id": project_id}
        )

        if not stats_row:
            # Calculate if not exists
            await DatabaseService.recalculate_project_statistics(project_id)
            stats_row = await database.fetch_one(
                query=query, values={"project_id": project_id}
            )

        if stats_row:
            return {
                "total_reviews": stats_row["total_reviews"],
                "work_completed_percentage": stats_row["work_completed_percentage"],
                "average_quality_rating": stats_row["average_quality_rating"],
                "reviews_with_images": stats_row["reviews_with_images"],
                "verified_reviews": stats_row["verified_reviews"],
                "review_type_breakdown": {
                    "Progress Update": stats_row["progress_updates"],
                    "Quality Issue": stats_row["quality_issues"],
                    "Completion Verification": stats_row["completion_verifications"],
                    "Delay Report": stats_row["delay_reports"],
                    "Fraud Alert": stats_row["fraud_alerts"],
                },
            }

        return {
            "total_reviews": 0,
            "work_completed_percentage": 0,
            "average_quality_rating": None,
            "reviews_with_images": 0,
            "verified_reviews": 0,
            "review_type_breakdown": {},
        }

    @staticmethod
    async def recalculate_project_statistics(project_id: str):
        """Recalculate and update project statistics"""

        # Get all reports for the project
        reports_query = "SELECT * FROM citizen_reports WHERE project_id = :project_id"
        reports = await database.fetch_all(
            query=reports_query, values={"project_id": project_id}
        )

        # Calculate statistics
        total_reviews = len(reports)
        work_completed_count = sum(1 for r in reports if r["work_completed"])
        work_completed_percentage = (
            (work_completed_count / total_reviews * 100) if total_reviews > 0 else 0
        )

        ratings = [r["quality_rating"] for r in reports if r["quality_rating"]]
        avg_rating = sum(ratings) / len(ratings) if ratings else None

        reviews_with_images = sum(
            1 for r in reports if r["photo_urls"] and json.loads(r["photo_urls"])
        )
        verified_reviews = sum(1 for r in reports if r["verified"])

        # Count review types
        review_type_counts = {
            "progress_updates": 0,
            "quality_issues": 0,
            "completion_verifications": 0,
            "delay_reports": 0,
            "fraud_alerts": 0,
        }

        for report in reports:
            review_type = report["review_type"].lower().replace(" ", "_")
            if review_type == "progress_update":
                review_type_counts["progress_updates"] += 1
            elif review_type == "quality_issue":
                review_type_counts["quality_issues"] += 1
            elif review_type == "completion_verification":
                review_type_counts["completion_verifications"] += 1
            elif review_type == "delay_report":
                review_type_counts["delay_reports"] += 1
            elif review_type == "fraud_alert":
                review_type_counts["fraud_alerts"] += 1

        # Update statistics
        upsert_query = """
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
            query=upsert_query,
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

    @staticmethod
    async def get_ministries() -> List[str]:
        """Get all ministries"""
        query = "SELECT name FROM ministries ORDER BY name"
        rows = await database.fetch_all(query=query)
        return [row["name"] for row in rows]

    @staticmethod
    async def get_overall_statistics() -> Dict[Any, Any]:
        """Get overall platform statistics"""

        # Project counts by status
        status_query = """
            SELECT status, COUNT(*) as count 
            FROM projects 
            GROUP BY status
        """
        status_rows = await database.fetch_all(query=status_query)
        status_breakdown = {row["status"]: row["count"] for row in status_rows}

        # Total contract value
        total_value_query = """
            SELECT SUM(CAST(procurement_plan->>'contract_amount' AS FLOAT)) as total_value
            FROM projects 
            WHERE procurement_plan->>'contract_amount' IS NOT NULL
        """
        total_value_row = await database.fetch_one(query=total_value_query)
        total_value = (
            total_value_row["total_value"]
            if total_value_row and total_value_row["total_value"]
            else 0
        )

        # Average progress
        avg_progress_query = (
            "SELECT AVG(progress_percentage) as avg_progress FROM projects"
        )
        avg_progress_row = await database.fetch_one(query=avg_progress_query)
        avg_progress = (
            avg_progress_row["avg_progress"]
            if avg_progress_row and avg_progress_row["avg_progress"]
            else 0
        )

        # Total projects and reports
        total_projects = await database.fetch_val("SELECT COUNT(*) FROM projects")
        total_reports = await database.fetch_val("SELECT COUNT(*) FROM citizen_reports")
        ministries_count = await database.fetch_val("SELECT COUNT(*) FROM ministries")

        # Fiscal years
        fiscal_years_query = (
            "SELECT DISTINCT fiscal_year FROM projects ORDER BY fiscal_year DESC"
        )
        fiscal_years_rows = await database.fetch_all(query=fiscal_years_query)
        fiscal_years = [row["fiscal_year"] for row in fiscal_years_rows]

        return {
            "total_projects": total_projects,
            "total_contract_value": total_value,
            "average_progress": round(avg_progress, 2),
            "status_breakdown": status_breakdown,
            "total_citizen_reports": total_reports,
            "ministries_count": ministries_count,
            "fiscal_years": fiscal_years,
        }
