import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Project, ProjectFilter, Statistics, FilterOptions } from '../../types';

// Change this to your computer's IP address when testing on physical device
// You can find your IP with: ipconfig (Windows) or ifconfig (Mac/Linux)
const API_BASE_URL = __DEV__ ? 'http://localhost:8000' : 'http://localhost:8000';

export const projectsApi = createApi({
  reducerPath: 'projectsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/api/projects/`,
  }),
  tagTypes: ['Project', 'Report', 'Statistics'],
  endpoints: (builder) => ({
    // Get all projects with filters
    getProjects: builder.query<Project[], ProjectFilter>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            searchParams.append(key, String(value));
          }
        });
        return `?${searchParams.toString()}`;
      },
      providesTags: ['Project'],
    }),
    
    // Get single project
    getProject: builder.query<Project, string>({
      query: (projectId) => `${projectId}`,
      providesTags: (result, error, projectId) => [
        { type: 'Project', id: projectId }
      ],
    }),
    
    // Get project progress
    getProjectProgress: builder.query<any, string>({
      query: (projectId) => `${projectId}/progress`,
    }),
    
    // Submit citizen report (legacy endpoint)
    submitReport: builder.mutation<any, { projectId: string; reportData: any }>({
      query: ({ projectId, reportData }) => ({
        url: `${projectId}/report`,
        method: 'POST',
        body: reportData,
      }),
      invalidatesTags: ['Project', 'Report'],
    }),
    
    // Get project reports
    getProjectReports: builder.query<any[], string>({
      query: (projectId) => `${projectId}/reports`,
      providesTags: ['Report'],
    }),
    
    // Get statistics
    getStatistics: builder.query<Statistics, void>({
      query: () => 'stats/overview',
      providesTags: ['Statistics'],
    }),
    
    // Get filter options
    getFilterOptions: builder.query<FilterOptions, void>({
      query: () => 'filters/options',
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useGetProjectQuery,
  useGetProjectProgressQuery,
  useSubmitReportMutation,
  useGetProjectReportsQuery,
  useGetStatisticsQuery,
  useGetFilterOptionsQuery,
} = projectsApi;