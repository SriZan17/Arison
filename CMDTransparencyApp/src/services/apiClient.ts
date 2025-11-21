import axios from 'axios';

// Use your local backend URL or deployed URL
const API_BASE_URL = 'http://localhost:8000';
// For testing on physical device, use your computer's IP address:
// const API_BASE_URL = 'http://192.168.1.100:8000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
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
    console.log('API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.response?.data);
    
    if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    } else if (error.response?.status === 400) {
      throw new Error(error.response?.data?.detail || 'Bad request');
    }
    
    return Promise.reject(error);
  }
);

export const API_ENDPOINTS = {
  // Projects API
  projects: {
    getAll: '/api/projects/',
    getById: (id: string) => `/api/projects/${id}`,
    getProgress: (id: string) => `/api/projects/${id}/progress`,
    submitReport: (id: string) => `/api/projects/${id}/report`,
    getReports: (id: string) => `/api/projects/${id}/reports`,
    getStats: '/api/projects/stats/overview',
    getFilterOptions: '/api/projects/filters/options'
  },
  // Reviews API
  reviews: {
    uploadImage: '/api/reviews/upload-image',
    uploadMultipleImages: '/api/reviews/upload-images',
    submitWithImages: (projectId: string) => `/api/reviews/${projectId}/submit`,
    getImage: (filename: string) => `/api/reviews/image/${filename}`,
    getSpecificReview: (projectId: string, reviewId: string) => 
      `/api/reviews/${projectId}/review/${reviewId}`,
    getAllReviews: (projectId: string) => `/api/reviews/${projectId}/all`,
    getReviewSummary: (projectId: string) => `/api/reviews/${projectId}/summary`,
    deleteImage: (filename: string) => `/api/reviews/image/${filename}`
  },
  // Utility
  health: '/health'
};