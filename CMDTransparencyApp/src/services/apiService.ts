import axios, { AxiosResponse } from 'axios';
import { Project, ProjectFilter, Statistics, FilterOptions, CitizenReport, ReviewSubmission, ReviewSubmissionResponse, ImageUploadResponse, ReviewSummary } from '../types';
import { mockProjects, filterMockProjects } from '../data/mockProjects';

// API Configuration
// Prefer an explicit env var, otherwise for web use the current hostname so the
// frontend can reach a backend on the same machine. Keep the original
// fallbacks for native/dev builds.
const API_BASE_URL =
  (process.env.REACT_APP_API_URL as string | undefined) ||
  (typeof window !== 'undefined'
    ? `http://${window.location.hostname}:8000`
    : __DEV__
    ? 'http://192.168.88.191:8000'
    : 'http://localhost:8000');

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // increase timeout to handle slower local backends during development
  timeout: 20000,
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
    // log extra info for network/timeouts
    const code = (error && error.code) || null;
    const message = error.response?.data || error.message;
    if (code === 'ECONNABORTED') {
      console.error('API Response Error: request timeout', { code, message });
    } else {
      console.error('API Response Error:', message, { code });
    }
    return Promise.reject(error);
  }
);

const shouldUseMockFallback = (error: any): boolean => {
  if (!error) return false;
  if (error.code === 'ERR_NETWORK') return true;
  if (error.isAxiosError && !error.response) return true;
  return false;
};

const buildMockStatistics = (): Statistics => {
  const totalProjects = mockProjects.length;
  const totalContractValue = mockProjects.reduce(
    (sum, project) => sum + (project.procurement_plan.contract_amount ?? 0),
    0
  );
  const averageProgress = totalProjects
    ? mockProjects.reduce((sum, project) => sum + (project.progress_percentage ?? 0), 0) / totalProjects
    : 0;
  const statusBreakdown = mockProjects.reduce<Record<string, number>>((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {});
  const totalCitizenReports = mockProjects.reduce(
    (sum, project) => sum + (project.citizen_reports_count ?? 0),
    0
  );
  const fiscalYears = Array.from(new Set(mockProjects.map((project) => project.fiscal_year)));
  const ministries = Array.from(new Set(mockProjects.map((project) => project.ministry)));

  return {
    total_projects: totalProjects,
    total_contract_value: totalContractValue,
    average_progress: Number(averageProgress.toFixed(2)),
    status_breakdown: statusBreakdown,
    total_citizen_reports: totalCitizenReports,
    ministries_count: ministries.length,
    fiscal_years: fiscalYears,
  };
};

const buildMockFilters = (): FilterOptions => ({
  ministries: Array.from(new Set(mockProjects.map((project) => project.ministry))),
  fiscal_years: Array.from(new Set(mockProjects.map((project) => project.fiscal_year))),
  statuses: Array.from(new Set(mockProjects.map((project) => project.status))),
  procurement_methods: Array.from(
    new Set(mockProjects.map((project) => project.procurement_plan.procurement_method))
  ),
});

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

    try {
      const response: AxiosResponse<Project[]> = await apiClient.get(
        `/api/projects/${params.toString() ? `?${params.toString()}` : ''}`
      );

      return response.data.map((project) => ({
        ...project,
        citizen_reports:
          project.citizen_reports?.map((report) => ({
            ...report,
            work_completed: Boolean(report.work_completed),
            verified: Boolean(report.verified),
          })) || [],
      }));
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        console.warn('API unreachable, serving mock project data.');
        return filterMockProjects(filters).map((project) => ({
          ...project,
          citizen_reports:
            project.citizen_reports?.map((report) => ({
              ...report,
              work_completed: Boolean(report.work_completed),
              verified: Boolean(report.verified),
            })) || [],
        }));
      }
      throw error;
    }
  },

  // Get single project
  getProject: async (projectId: string): Promise<Project> => {
    try {
      const response: AxiosResponse<Project> = await apiClient.get(`/api/projects/${projectId}`);
      return {
        ...response.data,
        citizen_reports:
          response.data.citizen_reports?.map((report) => ({
            ...report,
            work_completed: Boolean(report.work_completed),
            verified: Boolean(report.verified),
          })) || [],
      };
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        console.warn(`API unreachable, serving mock project ${projectId}.`);
        const mockProject = mockProjects.find((project) => project.id === projectId);
        if (!mockProject) {
          throw error;
        }
        return mockProject;
      }
      throw error;
    }
  },

  // Get project progress
  getProjectProgress: async (projectId: string): Promise<any> => {
    const response = await apiClient.get(`/api/projects/${projectId}/progress`);
    return response.data;
  },

  // Get statistics
  getStatistics: async (): Promise<Statistics> => {
    try {
      const response: AxiosResponse<Statistics> = await apiClient.get('/api/projects/stats/overview');
      return response.data;
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        console.warn('API unreachable, serving mock statistics.');
        return buildMockStatistics();
      }
      throw error;
    }
  },

  // Get filter options
  getFilterOptions: async (): Promise<FilterOptions> => {
    try {
      const response: AxiosResponse<FilterOptions> = await apiClient.get('/api/projects/filters/options');
      return response.data;
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        console.warn('API unreachable, serving mock filter options.');
        return buildMockFilters();
      }
      throw error;
    }
  },

  // Submit report (legacy)
  submitReport: async (projectId: string, reportData: any): Promise<any> => {
    const response = await apiClient.post(`/api/projects/${projectId}/report`, reportData);
    return response.data;
  },

  // Get project reports
  getProjectReports: async (projectId: string): Promise<CitizenReport[]> => {
    try {
      const response: AxiosResponse<CitizenReport[]> = await apiClient.get(`/api/projects/${projectId}/reports`);
      return response.data;
    } catch (error) {
      if (shouldUseMockFallback(error)) {
        console.warn(`API unreachable, serving mock reports for ${projectId}.`);
        const mockProject = mockProjects.find((project) => project.id === projectId);
        return mockProject?.citizen_reports || [];
      }
      throw error;
    }
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
  if (error && error.code === 'ECONNABORTED') {
    return 'Request timed out: the server did not respond in time';
  }

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