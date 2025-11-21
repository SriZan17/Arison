from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import (
    ProcurementProject,
    CitizenReport,
    ProjectStatus,
    ProcurementMethod,
)
from app.database.service import DatabaseService
from datetime import datetime

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/", response_model=List[dict])
async def get_projects(
    ministry: Optional[str] = Query(None, description="Filter by ministry"),
    status: Optional[ProjectStatus] = Query(
        None, description="Filter by project status"
    ),
    fiscal_year: Optional[str] = Query(None, description="Filter by fiscal year"),
    min_amount: Optional[float] = Query(None, description="Minimum contract amount"),
    max_amount: Optional[float] = Query(None, description="Maximum contract amount"),
    search: Optional[str] = Query(None, description="Search in project details"),
):
    """
    Get all procurement projects with optional filters.

    This endpoint supports filtering by:
    - Ministry/Department
    - Project Status (Planning, In Progress, Completed, etc.)
    - Fiscal Year
    - Contract Amount Range
    - Text Search
    """
    projects = await DatabaseService.get_all_projects(
        ministry=ministry,
        status=status.value if status else None,
        fiscal_year=fiscal_year,
        min_amount=min_amount,
        max_amount=max_amount,
        search=search,
    )

    return projects


@router.get("/{project_id}", response_model=dict)
async def get_project(project_id: str):
    """
    Get detailed information about a specific project.

    Returns complete project details including:
    - Procurement plan
    - Timeline information
    - Progress status
    - Citizen reports
    - Location data
    """
    project = await DatabaseService.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    return project


@router.get("/{project_id}/progress", response_model=dict)
async def get_project_progress(project_id: str):
    """
    Get progress tracking information for a specific project.

    Returns:
    - Current completion percentage
    - Status
    - Timeline milestones
    - Delays (if any)
    """
    project = await DatabaseService.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    plan = project["procurement_plan"]

    return {
        "project_id": project_id,
        "project_name": plan["details_of_work"],
        "status": project["status"],
        "progress_percentage": project["progress_percentage"],
        "timeline": {
            "contract_signed": plan.get("date_of_signing_contract"),
            "work_initiated": plan.get("date_of_initiation"),
            "expected_completion": plan.get("date_of_completion"),
        },
        "contractor": plan.get("contractor_name"),
        "contract_amount": plan.get("contract_amount"),
        "citizen_reports_count": len(project.get("citizen_reports", [])),
    }


@router.post("/{project_id}/report", response_model=dict)
async def submit_citizen_report(project_id: str, report: CitizenReport):
    """
    Submit a citizen report for a project.

    Allows citizens to report on project progress, quality issues,
    or discrepancies between official status and ground reality.
    """
    project = await DatabaseService.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Generate unique review ID
    import uuid

    review_id = f"REV-{uuid.uuid4().hex[:8].upper()}"

    # Create report in database
    new_report = await DatabaseService.create_citizen_report(
        review_id=review_id,
        project_id=project_id,
        reporter_name=report.reporter_name,
        reporter_contact=None,
        review_type="Citizen Report",
        review_text=report.report_text,
        work_completed=True,
        quality_rating=None,
        geolocation=report.geolocation,
        photo_urls=[report.photo_url] if report.photo_url else [],
    )

    return {"message": "Report submitted successfully", "report": new_report}


@router.get("/{project_id}/reports", response_model=List[dict])
async def get_project_reports(project_id: str):
    """
    Get all citizen reports for a specific project.

    Returns a list of reports with verification status.
    """
    project = await DatabaseService.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    reports = await DatabaseService.get_project_reports(project_id)
    return reports


@router.get("/stats/overview", response_model=dict)
async def get_statistics():
    """
    Get overall statistics about procurement projects.

    Provides summary metrics for dashboard visualization.
    """
    stats = await DatabaseService.get_overall_statistics()
    return stats


@router.get("/filters/options", response_model=dict)
async def get_filter_options():
    """
    Get available filter options for the frontend.

    Returns:
    - Available ministries
    - Fiscal years
    - Status options
    - Procurement methods
    """
    stats = await DatabaseService.get_overall_statistics()
    ministries = await DatabaseService.get_ministries()

    return {
        "ministries": ministries,
        "fiscal_years": stats["fiscal_years"],
        "statuses": [status.value for status in ProjectStatus],
        "procurement_methods": [method.value for method in ProcurementMethod],
    }
