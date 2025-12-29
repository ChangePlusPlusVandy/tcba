import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useOrgActiveSurveys = () => {
  const api = useApi();

  return useQuery({
    queryKey: ['surveys', 'active', 'list'],
    queryFn: async () => {
      const response = await api.get('/api/surveys/active/list');
      return response || [];
    },
    staleTime: 3 * 60 * 1000,
  });
};

export const useOrgSurveyResponses = (organizationId: string | undefined) => {
  const api = useApi();

  return useQuery({
    queryKey: ['survey-responses', 'organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const response = await api.get(`/api/survey-responses/organization/${organizationId}`);
      return response || [];
    },
    enabled: !!organizationId,
    staleTime: 2 * 60 * 1000,
  });
};
