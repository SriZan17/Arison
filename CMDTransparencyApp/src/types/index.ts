export interface Project {
  id: string;
  fiscal_year: string;
  ministry: string;
  budget_subtitle: string;
  procurement_plan: ProcurementPlan;
  signatures?: Signatures;
  status: ProjectStatus;
  progress_percentage: number;
  location?: Location;
  citizen_reports?: CitizenReport[];
  citizen_reports_count: number;
}

export interface ProcurementPlan {
  sl_no: number;
  project_type: string;
  details_of_work: string;
  date_of_approval?: string;
  procurement_method: string;
  no_of_package: number;
  type_of_contract?: string;
  date_of_agreement?: string;
  date_of_signing_contract?: string;
  date_of_initiation?: string;
  date_of_completion?: string;
  contractor_name?: string;
  contract_number?: string;
  contract_amount?: number;
}

export interface Signatures {
  preparing_officer?: Signature;
  chief_of_office?: Signature;
  department_head?: Signature;
}

export interface Signature {
  signature?: string;
  designation?: string;
  date?: string;
}

export interface Location {
  lat: number;
  lng: number;
  address?: string;
}

export interface CitizenReport {
  review_id: string;
  reporter_name?: string;
  reporter_contact?: string;
  review_type: ReviewType;
  review_text: string;
  work_completed: boolean;
  quality_rating?: number;
  geolocation?: Location;
  photo_urls: string[];
  verified: boolean;
  timestamp: string;
}

export interface ReviewSubmission {
  reporter_name?: string;
  reporter_contact?: string;
  review_type: ReviewType;
  review_text: string;
  work_completed: boolean;
  quality_rating?: number;
  latitude?: number;
  longitude?: number;
  images: any[];
}

export interface Statistics {
  total_projects: number;
  total_contract_value: number;
  average_progress: number;
  status_breakdown: Record<string, number>;
  total_citizen_reports: number;
  ministries_count: number;
  fiscal_years: string[];
}

export interface ReviewSummary {
  project_id: string;
  total_reviews: number;
  work_completed_percentage: number;
  average_quality_rating?: number;
  review_type_breakdown: Record<string, number>;
  reviews_with_images: number;
  verified_reviews: number;
}

export interface FilterOptions {
  ministries: string[];
  fiscal_years: string[];
  statuses: string[];
  procurement_methods: string[];
}

export interface ProjectFilter {
  ministry?: string;
  status?: string;
  fiscal_year?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;
}

export enum ProjectStatus {
  PLANNING = "Planning",
  TENDER_OPEN = "Tender Open", 
  EVALUATION = "Evaluation",
  AWARDED = "Awarded",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  DELAYED = "Delayed",
  DISPUTED = "Disputed"
}

export enum ReviewType {
  PROGRESS_UPDATE = "Progress Update",
  QUALITY_ISSUE = "Quality Issue", 
  COMPLETION_VERIFICATION = "Completion Verification",
  DELAY_REPORT = "Delay Report",
  FRAUD_ALERT = "Fraud Alert"
}

export interface ImageUploadResponse {
  filename: string;
  file_path: string;
  file_size: number;
  upload_timestamp: string;
  message: string;
}

export interface ReviewSubmissionResponse {
  review_id: string;
  project_id: string;
  message: string;
  review: CitizenReport;
  uploaded_images: string[];
}