from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import date, datetime
from enum import Enum


class ProcurementMethod(str, Enum):
    WORKS_NCB = "Works-NCB"
    WORKS_ICB = "Works-ICB"
    GOODS_NCB = "Goods-NCB"
    GOODS_ICB = "Goods-ICB"
    CONSULTING = "Consulting"
    SHOPPING = "Shopping"


class ProjectStatus(str, Enum):
    PLANNING = "Planning"
    TENDER_OPEN = "Tender Open"
    EVALUATION = "Evaluation"
    AWARDED = "Awarded"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    DELAYED = "Delayed"
    DISPUTED = "Disputed"


class ReviewType(str, Enum):
    PROGRESS_UPDATE = "Progress Update"
    QUALITY_ISSUE = "Quality Issue"
    COMPLETION_VERIFICATION = "Completion Verification"
    DELAY_REPORT = "Delay Report"
    FRAUD_ALERT = "Fraud Alert"


class UserRole(str, Enum):
    CITIZEN = "citizen"
    OFFICIAL = "official"
    ADMIN = "admin"


class TenderDocuments(BaseModel):
    prepared_date: Optional[str] = None
    approved_date: Optional[str] = None


class TenderInfo(BaseModel):
    invitation_date: Optional[str] = None
    open_date: Optional[str] = None
    evaluation_completion_date: Optional[str] = None
    proposal_consent_received: Optional[str] = None


class Signature(BaseModel):
    signature: Optional[str] = None
    designation: Optional[str] = None
    date: Optional[str] = None


class Signatures(BaseModel):
    preparing_officer: Optional[Signature] = None
    chief_of_office: Optional[Signature] = None
    department_head: Optional[Signature] = None


class AnnualProcurementPlan(BaseModel):
    sl_no: int
    project_type: str
    details_of_work: str
    date_of_approval: Optional[str] = None
    procurement_method: ProcurementMethod
    no_of_package: int = 0
    type_of_contract: Optional[str] = None
    tender_documents: Optional[TenderDocuments] = None
    date_of_agreement: Optional[str] = None
    tender: Optional[TenderInfo] = None
    date_of_approval_tender: Optional[str] = None
    date_of_signing_contract: Optional[str] = None
    date_of_initiation: Optional[str] = None
    date_of_completion: Optional[str] = None
    contractor_name: Optional[str] = None
    contract_number: Optional[str] = None
    contract_amount: Optional[float] = None


class ProcurementProject(BaseModel):
    id: str
    fiscal_year: str
    ministry: str
    budget_subtitle: str
    procurement_plan: AnnualProcurementPlan
    signatures: Optional[Signatures] = None
    status: ProjectStatus
    progress_percentage: int = Field(ge=0, le=100, default=0)
    location: Optional[dict] = None  # {lat, lng, address}
    citizen_reports: List[dict] = []  # Citizen feedback


class CitizenReport(BaseModel):
    project_id: str
    reporter_name: Optional[str] = None
    report_text: str
    photo_url: Optional[str] = None
    geolocation: Optional[dict] = None
    timestamp: str
    verified: bool = False


class CitizenReview(BaseModel):
    """Enhanced citizen review with work completion status"""

    reporter_name: Optional[str] = Field(
        None, description="Name of the reporter (optional for anonymous reports)"
    )
    reporter_contact: Optional[str] = Field(
        None, description="Contact number or email (optional)"
    )
    review_type: ReviewType = Field(..., description="Type of review being submitted")
    review_text: str = Field(
        ..., min_length=10, description="Detailed review text (minimum 10 characters)"
    )
    work_completed: bool = Field(
        ..., description="Is the work completed according to official status?"
    )
    quality_rating: Optional[int] = Field(
        None, ge=1, le=5, description="Quality rating from 1-5 (if applicable)"
    )
    geolocation: Optional[dict] = Field(None, description="GPS coordinates {lat, lng}")


class ImageUploadResponse(BaseModel):
    """Response model for image upload"""

    filename: str
    file_path: str
    file_size: int
    upload_timestamp: str
    message: str


class ReviewSubmissionResponse(BaseModel):
    """Response model for review submission"""

    review_id: str
    project_id: str
    message: str
    review: dict
    uploaded_images: List[str]


class ProcurementFilter(BaseModel):
    ministry: Optional[str] = None
    status: Optional[ProjectStatus] = None
    fiscal_year: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None


# Authentication Models
class UserBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    phone: Optional[str] = Field(None, pattern=r"^\+?[\d\s\-()]{10,}$")
    role: UserRole = UserRole.CITIZEN


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    confirm_password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class User(UserBase):
    id: str
    verified: bool = False
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserInDB(User):
    hashed_password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int
    user: User


class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[str] = None
