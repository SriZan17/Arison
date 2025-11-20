from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date
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


class ProcurementFilter(BaseModel):
    ministry: Optional[str] = None
    status: Optional[ProjectStatus] = None
    fiscal_year: Optional[str] = None
    min_amount: Optional[float] = None
    max_amount: Optional[float] = None
