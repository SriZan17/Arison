import { useState, useEffect, useCallback } from 'react';
import { projectsApi, reviewsApi, handleApiError } from '../services/apiService';
import { Project, ProjectFilter, Statistics, FilterOptions, CitizenReport, ReviewSummary } from '../types';

// Generic API hook
interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

function useApiCall<T>(apiCall: () => Promise<T>, dependencies: any[] = []): ApiState<T> & { refetch: () => void } {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const result = await apiCall();
      setState({ data: result, loading: false, error: null });
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState({ data: null, loading: false, error: errorMessage });
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
  };
}

// Specific API hooks
export const useProjects = (filters?: ProjectFilter) => {
  return useApiCall<Project[]>(
    () => projectsApi.getProjects(filters),
    [JSON.stringify(filters)]
  );
};

export const useProject = (projectId: string) => {
  return useApiCall<Project>(
    () => projectsApi.getProject(projectId),
    [projectId]
  );
};

export const useStatistics = () => {
  return useApiCall<Statistics>(
    () => projectsApi.getStatistics(),
    []
  );
};

export const useFilterOptions = () => {
  return useApiCall<FilterOptions>(
    () => projectsApi.getFilterOptions(),
    []
  );
};

export const useProjectReports = (projectId: string) => {
  return useApiCall<CitizenReport[]>(
    () => projectsApi.getProjectReports(projectId),
    [projectId]
  );
};

export const useReviewSummary = (projectId: string) => {
  return useApiCall<ReviewSummary>(
    () => reviewsApi.getReviewSummary(projectId),
    [projectId]
  );
};

// Manual API call hooks (for mutations)
export const useApiMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>
) => {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
  }>({ loading: false, error: null });

  const mutate = useCallback(async (variables: TVariables): Promise<TData | null> => {
    setState({ loading: true, error: null });
    try {
      const result = await mutationFn(variables);
      setState({ loading: false, error: null });
      return result;
    } catch (error) {
      const errorMessage = handleApiError(error);
      setState({ loading: false, error: errorMessage });
      return null;
    }
  }, [mutationFn]);

  return {
    ...state,
    mutate,
  };
};

// Specific mutation hooks
export const useSubmitReport = () => {
  return useApiMutation<any, { projectId: string; reportData: any }>(
    ({ projectId, reportData }) => projectsApi.submitReport(projectId, reportData)
  );
};

export const useUploadImage = () => {
  return useApiMutation<any, FormData>(
    (formData) => reviewsApi.uploadImage(formData)
  );
};

export const useSubmitReview = () => {
  return useApiMutation<any, { projectId: string; reviewData: FormData }>(
    ({ projectId, reviewData }) => reviewsApi.submitReviewWithImages(projectId, reviewData)
  );
};