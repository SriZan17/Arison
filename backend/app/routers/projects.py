from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from app.models.schemas import (
    ProcurementProject,
    CitizenReport,
    ProjectStatus,
    ProcurementMethod,
)
from app.data.mock_data import (
    get_all_projects,
    get_project_by_id,
    get_ministries,
    get_fiscal_years,
    mock_projects,
)
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
    projects = get_all_projects()

    # Apply filters
    if ministry:
        projects = [p for p in projects if ministry.lower() in p["ministry"].lower()]

    if status:
        projects = [p for p in projects if p["status"] == status]

    if fiscal_year:
        projects = [p for p in projects if p["fiscal_year"] == fiscal_year]

    if min_amount:
        projects = [
            p
            for p in projects
            if p["procurement_plan"].get("contract_amount")
            and p["procurement_plan"]["contract_amount"] >= min_amount
        ]

    if max_amount:
        projects = [
            p
            for p in projects
            if p["procurement_plan"].get("contract_amount")
            and p["procurement_plan"]["contract_amount"] <= max_amount
        ]

    if search:
        search_lower = search.lower()
        projects = [
            p
            for p in projects
            if search_lower in p["procurement_plan"]["details_of_work"].lower()
            or search_lower in p["ministry"].lower()
        ]

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
    project = get_project_by_id(project_id)

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
    project = get_project_by_id(project_id)

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
    project = get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # In a real app, this would save to a database
    new_report = {
        "reporter_name": report.reporter_name,
        "report_text": report.report_text,
        "photo_url": report.photo_url,
        "geolocation": report.geolocation,
        "timestamp": report.timestamp,
        "verified": report.verified,
    }

    # Add to the mock data (in-memory for demo)
    project["citizen_reports"].append(new_report)

    return {"message": "Report submitted successfully", "report": new_report}


@router.get("/{project_id}/reports", response_model=List[dict])
async def get_project_reports(project_id: str):
    """
    Get all citizen reports for a specific project.

    Returns a list of reports with verification status.
    """
    project = get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    return project.get("citizen_reports", [])


@router.get("/stats/overview", response_model=dict)
async def get_statistics():
    """
    Get overall statistics about procurement projects.

    Provides summary metrics for dashboard visualization.
    """
    projects = get_all_projects()

    total_amount = sum(
        p["procurement_plan"].get("contract_amount", 0) for p in projects
    )

    status_counts = {}
    for project in projects:
        status = project["status"]
        status_counts[status] = status_counts.get(status, 0) + 1

    avg_progress = sum(p["progress_percentage"] for p in projects) / len(projects)

    return {
        "total_projects": len(projects),
        "total_contract_value": total_amount,
        "average_progress": round(avg_progress, 2),
        "status_breakdown": status_counts,
        "ministries_count": len(get_ministries()),
        "fiscal_years": get_fiscal_years(),
    }


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
    return {
        "ministries": get_ministries(),
        "fiscal_years": get_fiscal_years(),
        "statuses": [status.value for status in ProjectStatus],
        "procurement_methods": [method.value for method in ProcurementMethod],
    }
