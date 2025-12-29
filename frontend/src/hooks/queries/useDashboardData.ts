import { useQueries, useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useDashboardData = () => {
  const api = useApi();

  const results = useQueries({
    queries: [
      {
        queryKey: ['organization', 'profile'],
        queryFn: () => api.get('/api/organizations/profile'),
      },
      {
        queryKey: ['alerts', { page: 1, limit: 50 }],
        queryFn: () => api.get('/api/alerts?page=1&limit=50'),
      },
      {
        queryKey: ['surveys'],
        queryFn: () => api.get('/api/surveys'),
      },
      {
        queryKey: ['announcements', 'dashboard'],
        queryFn: () => api.get('/api/announcements'),
      },
      {
        queryKey: ['blogs', 'dashboard'],
        queryFn: () => api.get('/api/blogs'),
      },
    ],
  });

  const orgProfile = results[0].data;
  const orgId = orgProfile?.id;

  const { data: surveyResponses } = useQuery({
    queryKey: ['survey-responses', 'organization', orgId],
    queryFn: () => api.get(`/api/survey-responses/organization/${orgId}`),
    enabled: !!orgId,
  });

  const isLoading = results.some((r) => r.isLoading);
  const isError = results.some((r) => r.isError);

  return {
    orgProfile,
    alerts: results[1].data,
    surveys: results[2].data,
    surveyResponses,
    announcements: results[3].data,
    blogs: results[4].data,
    isLoading,
    isError,
  };
};
