import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgActiveSurveys = (page = 1, limit = 50) => {
  const api = useApi();

  return useQuery({
    queryKey: ['surveys', 'active', 'list', { page, limit }],
    queryFn: async () => {
      const response = await api.get(`/api/surveys/active/list?page=${page}&limit=${limit}`);
      return response || { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    },
    staleTime: 3 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};

export const useOrgSurveyResponses = (
  organizationId: string | undefined,
  page = 1,
  limit = 50
) => {
  const api = useApi();

  return useQuery({
    queryKey: ['survey-responses', 'organization', organizationId, { page, limit }],
    queryFn: async () => {
      if (!organizationId) return { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
      const response = await api.get(
        `/api/survey-responses/organization/${organizationId}?page=${page}&limit=${limit}`
      );
      return response || { data: [], pagination: { page, limit, total: 0, totalPages: 0 } };
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
};
