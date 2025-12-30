import { useQuery } from '@tanstack/react-query';
import { useApi } from '../useApi';

export const useSurvey = (surveyId: string | undefined) => {
  const api = useApi();

  return useQuery({
    queryKey: ['survey', surveyId],
    queryFn: async () => {
      if (!surveyId) throw new Error('Survey ID is required');
      const response = await api.get(`/api/surveys/${surveyId}`);
      return response;
    },
    enabled: !!surveyId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useSurveyResponsesBySurvey = (surveyId: string | undefined) => {
  const api = useApi();

  return useQuery({
    queryKey: ['survey-responses', 'survey', surveyId],
    queryFn: async () => {
      if (!surveyId) throw new Error('Survey ID is required');
      const response = await api.get(`/api/survey-responses/survey/${surveyId}`);
      return response;
    },
    enabled: !!surveyId,
    staleTime: 2 * 60 * 1000,
  });
};
