from fastapi import APIRouter, UploadFile, File, Form, HTTPException
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
)
from app.data.mock_data import get_project_by_id, mock_projects

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
    project = get_project_by_id(project_id)
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

    # Create review object
    review = {
        "review_id": review_id,
        "reporter_name": reporter_name or "Anonymous",
        "reporter_contact": reporter_contact,
        "review_type": review_type.value,
        "review_text": review_text,
        "work_completed": work_completed,
        "quality_rating": quality_rating,
        "geolocation": geolocation,
        "photo_urls": uploaded_image_paths,
        "timestamp": datetime.now().isoformat(),
        "verified": False,
    }

    # Add review to project (in-memory for demo)
    project["citizen_reports"].append(review)

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


@router.get("/{project_id}/all")
async def get_all_reviews(project_id: str):
    """
    Get all reviews for a specific project.

    Returns reviews with image URLs that can be accessed via /api/reviews/image/{filename}
    """
    project = get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    return {
        "project_id": project_id,
        "project_name": project["procurement_plan"]["details_of_work"],
        "total_reviews": len(project.get("citizen_reports", [])),
        "reviews": project.get("citizen_reports", []),
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
    project = get_project_by_id(project_id)

    if not project:
        raise HTTPException(status_code=404, detail=f"Project {project_id} not found")

    reviews = project.get("citizen_reports", [])

    if not reviews:
        return {
            "project_id": project_id,
            "total_reviews": 0,
            "message": "No reviews yet for this project",
        }

    # Calculate statistics
    completed_count = sum(1 for r in reviews if r.get("work_completed", False))
    ratings = [r.get("quality_rating") for r in reviews if r.get("quality_rating")]
    avg_rating = sum(ratings) / len(ratings) if ratings else None

    review_types = {}
    for review in reviews:
        rtype = review.get("review_type", "Unknown")
        review_types[rtype] = review_types.get(rtype, 0) + 1

    return {
        "project_id": project_id,
        "project_name": project["procurement_plan"]["details_of_work"],
        "total_reviews": len(reviews),
        "work_completed_percentage": round((completed_count / len(reviews)) * 100, 2),
        "average_quality_rating": round(avg_rating, 2) if avg_rating else None,
        "review_type_breakdown": review_types,
        "reviews_with_images": sum(1 for r in reviews if r.get("photo_urls")),
        "verified_reviews": sum(1 for r in reviews if r.get("verified", False)),
    }


@router.delete("/image/{filename}")
async def delete_review_image(filename: str):
    """
    Delete an uploaded review image.

    (In production, this should have authentication and authorization)
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Image not found")

    try:
        os.remove(file_path)
        return {"message": f"Image {filename} deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting file: {str(e)}")
