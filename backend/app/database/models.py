from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    Boolean,
    DateTime,
    JSON,
    ForeignKey,
    Enum,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.config import Base
import enum


class UserRole(enum.Enum):
    """User roles in the system"""

    CITIZEN = "citizen"
    OFFICIAL = "official"
    ADMIN = "admin"


class User(Base):
    """User accounts for authentication"""

    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CITIZEN)
    verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)


class Project(Base):
    """Government procurement project model"""

    __tablename__ = "projects"

    id = Column(String, primary_key=True, index=True)
    fiscal_year = Column(String, nullable=False)
    ministry = Column(String, nullable=False, index=True)
    budget_subtitle = Column(String)

    # Procurement plan details (stored as JSON for flexibility)
    procurement_plan = Column(JSON, nullable=False)

    # Signatures (stored as JSON)
    signatures = Column(JSON)

    # Project status and progress
    status = Column(String, nullable=False, index=True)
    progress_percentage = Column(Integer, default=0)

    # Location information (stored as JSON: {lat, lng, address})
    location = Column(JSON)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    citizen_reports = relationship(
        "CitizenReport", back_populates="project", cascade="all, delete-orphan"
    )


class CitizenReport(Base):
    """Citizen reports and reviews for projects"""

    __tablename__ = "citizen_reports"

    id = Column(Integer, primary_key=True, index=True)
    review_id = Column(String, unique=True, nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=False)

    # Reporter information (optional for anonymous reports)
    reporter_name = Column(String)
    reporter_contact = Column(String)

    # Review details
    review_type = Column(String, nullable=False)
    review_text = Column(Text, nullable=False)
    work_completed = Column(Boolean, nullable=False)
    quality_rating = Column(Integer)  # 1-5 rating

    # Location and evidence
    geolocation = Column(JSON)  # {lat, lng}
    photo_urls = Column(JSON)  # Array of image URLs

    # Status
    verified = Column(Boolean, default=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="citizen_reports")


class Ministry(Base):
    """Ministry/Department information"""

    __tablename__ = "ministries"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    description = Column(Text)
    contact_info = Column(JSON)  # {email, phone, address}

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ProjectStatistics(Base):
    """Cached project statistics for performance"""

    __tablename__ = "project_statistics"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(String, ForeignKey("projects.id"), unique=True, nullable=False)

    # Calculated statistics
    total_reviews = Column(Integer, default=0)
    work_completed_percentage = Column(Float, default=0.0)
    average_quality_rating = Column(Float)
    reviews_with_images = Column(Integer, default=0)
    verified_reviews = Column(Integer, default=0)

    # Review type counts
    progress_updates = Column(Integer, default=0)
    quality_issues = Column(Integer, default=0)
    completion_verifications = Column(Integer, default=0)
    delay_reports = Column(Integer, default=0)
    fraud_alerts = Column(Integer, default=0)

    # Last updated
    last_calculated = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    project = relationship("Project")


class UploadedImage(Base):
    """Track uploaded images for better management"""

    __tablename__ = "uploaded_images"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, unique=True, nullable=False)
    original_filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    content_type = Column(String, nullable=False)

    # Associated with which report
    citizen_report_id = Column(Integer, ForeignKey("citizen_reports.id"), nullable=True)

    # Timestamps
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    citizen_report = relationship("CitizenReport")
