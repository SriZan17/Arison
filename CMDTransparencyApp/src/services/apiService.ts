import axios, { AxiosResponse } from 'axios';
import { Project, ProjectFilter, Statistics, FilterOptions, CitizenReport, ReviewSubmission, ReviewSubmissionResponse, ImageUploadResponse, ReviewSummary } from '../types';

// API Configuration
const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Projects API
export const projectsApi = {
  // Get all projects with filters
  getProjects: async (filters?: ProjectFilter): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });
    }
    
    const response: AxiosResponse<Project[]> = await apiClient.get(
      `/api/projects/${params.toString() ? `?${params.toString()}` : ''}`
    );
    
    // Ensure boolean fields are properly converted
    return response.data.map(project => ({
      ...project,
      citizen_reports: project.citizen_reports?.map(report => ({
        ...report,
        work_completed: Boolean(report.work_completed),
        verified: Boolean(report.verified),
      })) || [],
    }));
  },

  // Get single project
  getProject: async (projectId: string): Promise<Project> => {
    const response: AxiosResponse<Project> = await apiClient.get(`/api/projects/${projectId}`);
    return {
      ...response.data,
      citizen_reports: response.data.citizen_reports?.map(report => ({
        ...report,
        work_completed: Boolean(report.work_completed),
        verified: Boolean(report.verified),
      })) || [],
    };
  },

  // Get project progress
  getProjectProgress: async (projectId: string): Promise<any> => {
    const response = await apiClient.get(`/api/projects/${projectId}/progress`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<Statistics> => {
    const response: AxiosResponse<Statistics> = await apiClient.get('/api/projects/stats/overview');
    return response.data;
  },

  // Get filter options
  getFilterOptions: async (): Promise<FilterOptions> => {
    const response: AxiosResponse<FilterOptions> = await apiClient.get('/api/projects/filters/options');
    return response.data;
  },

  // Submit report (legacy)
  submitReport: async (projectId: string, reportData: any): Promise<any> => {
    const response = await apiClient.post(`/api/projects/${projectId}/report`, reportData);
    return response.data;
  },

  // Get project reports
  getProjectReports: async (projectId: string): Promise<CitizenReport[]> => {
    const response: AxiosResponse<CitizenReport[]> = await apiClient.get(`/api/projects/${projectId}/reports`);
    return response.data;
  },
};

// Reviews API
export const reviewsApi = {
  // Upload single image
  uploadImage: async (formData: FormData): Promise<ImageUploadResponse> => {
    const response: AxiosResponse<ImageUploadResponse> = await apiClient.post(
      '/api/reviews/upload-image',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Upload multiple images
  uploadImages: async (formData: FormData): Promise<ImageUploadResponse[]> => {
    const response: AxiosResponse<ImageUploadResponse[]> = await apiClient.post(
      '/api/reviews/upload-images',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Submit review with images
  submitReviewWithImages: async (projectId: string, reviewData: FormData): Promise<ReviewSubmissionResponse> => {
    const response: AxiosResponse<ReviewSubmissionResponse> = await apiClient.post(
      `/api/reviews/${projectId}/submit`,
      reviewData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Get specific review
  getSpecificReview: async (projectId: string, reviewId: string): Promise<{ project_id: string; project_name: string; review: CitizenReport }> => {
    const response = await apiClient.get(`/api/reviews/${projectId}/review/${reviewId}`);
    return response.data;
  },

  // Get all reviews for project
  getAllReviews: async (projectId: string): Promise<{ project_id: string; project_name: string; total_reviews: number; reviews: CitizenReport[] }> => {
    const response = await apiClient.get(`/api/reviews/${projectId}/all`);
    return response.data;
  },

  // Get review summary
  getReviewSummary: async (projectId: string): Promise<ReviewSummary> => {
    const response: AxiosResponse<ReviewSummary> = await apiClient.get(`/api/reviews/${projectId}/summary`);
    return response.data;
  },

  // Delete image
  deleteImage: async (filename: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/reviews/image/${filename}`);
    return response.data;
  },
};

// Error handling helper
export const handleApiError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    const status = error.response.status;
    const message = error.response.data?.message || error.response.data?.detail || 'Server error';
    
    switch (status) {
      case 400:
        return `Bad request: ${message}`;
      case 401:
        return 'Unauthorized access';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Internal server error';
      default:
        return `Error ${status}: ${message}`;
    }
  } else if (error.request) {
    // Network error
    return 'Network error: Please check your internet connection';
  } else {
    // Other error
    return error.message || 'An unexpected error occurred';
  }
};

export default { projectsApi, reviewsApi, handleApiError };