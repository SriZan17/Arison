from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import FileResponse
from typing import List, Optional
import os
import uuid
from datetime import datetime
import aiofiles
from pathlib import Path
from app.models.schemas import (
    CitizenReview,
    ReviewType,
    ImageUploadResponse,
    ReviewSubmissionResponse,
    User,
)
from app.database.service import DatabaseService
from app.auth.dependencies import get_current_user_optional, get_current_active_user

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

# Configure upload directory
UPLOAD_DIR = Path("uploads/reviews")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def validate_image(filename: str, file_size: int) -> bool:
    """Validate image file extension and size"""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}",
        )
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {MAX_FILE_SIZE / (1024*1024)}MB",
        )
    return True


@router.post("/upload-image", response_model=ImageUploadResponse)
async def upload_review_image(file: UploadFile = File(...)):
    """
    Upload an image for a citizen review.

    Accepts image files (jpg, jpeg, png, gif, webp) up to 10MB.
    Returns the file path and metadata.
    """
    # Read file content to check size
    content = await file.read()
    file_size = len(content)

    # Validate the image
    validate_image(file.filename, file_size)

    # Generate unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    async with aiofiles.open(file_path, "wb") as f:
        await f.write(content)

    return ImageUploadResponse(
        filename=unique_filename,
        file_path=str(file_path),
        file_size=file_size,
        upload_timestamp=datetime.now().isoformat(),
        message="Image uploaded successfully",
    )


@router.post("/upload-images", response_model=List[ImageUploadResponse])
async def upload_multiple_images(files: List[UploadFile] = File(...)):
    """
    Upload multiple images for a citizen review.

    Accepts up to 5 images per submission.
    """
    if len(files) > 5:
        raise HTTPException(
            status_code=400, detail="Maximum 5 images allowed per submission"
        )

    uploaded_files = []

    for file in files:
        # Read and validate each file
        content = await file.read()
        file_size = len(content)
        validate_image(file.filename, file_size)

        # Generate unique filename
        file_extension = Path(file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / unique_filename

        # Save file
        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        uploaded_files.append(
            ImageUploadResponse(
                filename=unique_filename,
                file_path=str(file_path),
                file_size=file_size,
                upload_timestamp=datetime.now().isoformat(),
                message="Image uploaded successfully",
            )
        )

    return uploaded_files


@router.post("/{project_id}/submit", response_model=ReviewSubmissionResponse)
async def submit_review_with_images(
    project_id: str,
    reporter_name: Optional[str] = Form(None),
    reporter_contact: Optional[str] = Form(None),
    review_type: ReviewType = Form(...),
    review_text: str = Form(..., min_length=10),
    work_completed: bool = Form(...),
    quality_rating: Optional[int] = Form(None, ge=1, le=5),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    images: List[UploadFile] = File(default=[]),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """
    Submit a complete citizen review with optional images.

    This endpoint handles both the review data and image uploads in a single request.

    Parameters:
    - project_id: ID of the project being reviewed
    - reporter_name: Name of the reporter (optional for anonymous)
    - reporter_contact: Contact information (optional)
    - review_type: Type of review (Progress Update, Quality Issue, etc.)
    - review_text: Detailed review description (min 10 characters)
    - work_completed: Boolean indicating if work is completed as claimed
    - quality_rating: Quality rating 1-5 (optional)
    - latitude: GPS latitude (optional)
    - longitude: GPS longitude (optional)
    - images: Up to 5 images (optional)
    """
    # Verify project exists
    project = await DatabaseService.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Validate image count
    if len(images) > 5:
        raise HTTPException(
            status_code=400, detail="Maximum 5 images allowed per review"
        )

    # Upload images
    uploaded_image_paths = []
    for image in images:
        if image.filename:  # Check if file was actually uploaded
            content = await image.read()
            file_size = len(content)
            validate_image(image.filename, file_size)

            file_extension = Path(image.filename).suffix
            unique_filename = f"{uuid.uuid4()}{file_extension}"
            file_path = UPLOAD_DIR / unique_filename

            async with aiofiles.open(file_path, "wb") as f:
                await f.write(content)

            uploaded_image_paths.append(str(file_path))

    # Create geolocation object if coordinates provided
    geolocation = None
    if latitude is not None and longitude is not None:
        geolocation = {"lat": latitude, "lng": longitude}

    # Generate unique review ID
    review_id = f"REV-{uuid.uuid4().hex[:8].upper()}"

    # If user is authenticated, use their information
    if current_user:
        reporter_name = reporter_name or current_user.name
        if not reporter_contact and current_user.phone:
            reporter_contact = current_user.phone

    # Create review in database
    review = await DatabaseService.create_citizen_report(
        review_id=review_id,
        project_id=project_id,
        reporter_name=reporter_name or "Anonymous",
        reporter_contact=reporter_contact,
        review_type=review_type.value,
        review_text=review_text,
        work_completed=work_completed,
        quality_rating=quality_rating,
        geolocation=geolocation,
        photo_urls=uploaded_image_paths,
    )

    return ReviewSubmissionResponse(
        review_id=review_id,
        project_id=project_id,
        message="Review submitted successfully",
        review=review,
        uploaded_images=uploaded_image_paths,
    )


@router.get("/image/{filename}")
async def get_review_image(filename: str):
    """
    Retrieve an uploaded review image.

    Returns the image file for display in the frontend.
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(file_path)


@router.get("/{project_id}/review/{review_id}")
async def get_specific_review(project_id: str, review_id: str):
    """
    Get a specific review by review_id for a project.

    Returns detailed information about a single citizen review including
    all associated images and metadata.
    """
    # Verify project exists
    project = await DatabaseService.get_project_by_id(project_id)
    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    # Get the specific review
    review = await DatabaseService.get_specific_review(project_id, review_id)

    if not review:
        raise HTTPException(
            status_code=404,
            detail=f"Review {review_id} not found for project {project_id}",
        )

    return {
        "project_id": project_id,
        "project_name": project["procurement_plan"]["details_of_work"],
        "review": review,
    }


@router.get("/{project_id}/all")
async def get_all_reviews(project_id: str):
    """
    Get all reviews for a specific project.

    Returns reviews with image URLs that can be accessed via /api/reviews/image/{filename}
    """
    project = await DatabaseService.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    reviews = await DatabaseService.get_project_reports(project_id)

    return {
        "project_id": project_id,
        "project_name": project["procurement_plan"]["details_of_work"],
        "total_reviews": len(reviews),
        "reviews": reviews,
    }


@router.get("/{project_id}/summary")
async def get_project_review_summary(project_id: str):
    """
    Get summary statistics of reviews for a project.

    Returns aggregated data like:
    - Total reviews
    - Percentage claiming work is completed
    - Average quality rating
    - Review type breakdown
    """
    project = await DatabaseService.get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    stats = await DatabaseService.get_project_statistics(project_id)

    if stats["total_reviews"] == 0:
        return {
            "project_id": project_id,
            "total_reviews": 0,
            "message": "No reviews yet for this project",
        }

    return {
        "project_id": project_id,
        "project_name": project["procurement_plan"]["details_of_work"],
        "total_reviews": stats["total_reviews"],
        "work_completed_percentage": stats["work_completed_percentage"],
        "average_quality_rating": stats["average_quality_rating"],
        "review_type_breakdown": stats["review_type_breakdown"],
        "reviews_with_images": stats["reviews_with_images"],
        "verified_reviews": stats["verified_reviews"],
    }


@router.get("/my-reviews")
async def get_my_reviews(current_user: User = Depends(get_current_active_user)):
    """
    Get all reviews submitted by the current authenticated user
    """
    try:
        # In a real app, this would query the database by user_id
        # For now, we'll return a placeholder response
        return {
            "user_id": current_user.id,
            "user_name": current_user.name,
            "total_reviews": 0,
            "reviews": [],
            "message": "Your submitted reviews will appear here",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error fetching user reviews: {str(e)}"
        )


@router.delete("/image/{filename}")
async def delete_review_image(
    filename: str, current_user: User = Depends(get_current_active_user)
):
    """
    Delete an uploaded review image (authenticated users only).
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        os.remove(file_path)
        return {
            "message": f"Image {filename} deleted successfully",
            "deleted_by": current_user.name,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
