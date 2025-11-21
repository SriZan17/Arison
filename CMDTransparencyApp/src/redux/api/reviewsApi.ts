import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { 
  CitizenReport, 
  ReviewSubmission, 
  ReviewSubmissionResponse, 
  ImageUploadResponse,
  ReviewSummary 
} from '../../types';

// Change this to your computer's IP address when testing on physical device
const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'http://localhost:8000';

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/reviews/`,
  }),
  tagTypes: ['Review', 'Image'],
  endpoints: (builder) => ({
    // Upload single image
    uploadImage: builder.mutation<ImageUploadResponse, FormData>({
      query: (formData) => ({
        url: 'upload-image',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),
    
    // Upload multiple images
    uploadImages: builder.mutation<ImageUploadResponse[], FormData>({
      query: (formData) => ({
        url: 'upload-images',
        method: 'POST',
        body: formData,
        formData: true,
      }),
    }),
    
    // Submit review with images
    submitReviewWithImages: builder.mutation<
      ReviewSubmissionResponse, 
      { projectId: string; reviewData: FormData }
    >({
      query: ({ projectId, reviewData }) => ({
        url: `${projectId}/submit`,
        method: 'POST',
        body: reviewData,
        formData: true,
      }),
      invalidatesTags: ['Review'],
    }),
    
    // Get specific review
    getSpecificReview: builder.query<
      { project_id: string; project_name: string; review: CitizenReport }, 
      { projectId: string; reviewId: string }
    >({
      query: ({ projectId, reviewId }) => `${projectId}/review/${reviewId}`,
    }),
    
    // Get all reviews for project
    getAllReviews: builder.query<
      { 
        project_id: string; 
        project_name: string; 
        total_reviews: number; 
        reviews: CitizenReport[] 
      }, 
      string
    >({
      query: (projectId) => `${projectId}/all`,
      providesTags: ['Review'],
    }),
    
    // Get review summary
    getReviewSummary: builder.query<ReviewSummary, string>({
      query: (projectId) => `${projectId}/summary`,
    }),
    
    // Delete image
    deleteImage: builder.mutation<{ message: string }, string>({
      query: (filename) => ({
        url: `image/${filename}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Image'],
    }),
  }),
});

export const {
  useUploadImageMutation,
  useUploadImagesMutation,
  useSubmitReviewWithImagesMutation,
  useGetSpecificReviewQuery,
  useGetAllReviewsQuery,
  useGetReviewSummaryQuery,
  useDeleteImageMutation,
} = reviewsApi;