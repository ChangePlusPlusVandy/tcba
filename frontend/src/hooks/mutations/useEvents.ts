import { useAuth } from '@clerk/clerk-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE_URL } from '../../config/api';

// import { useApi } from '../useApi';

/**
 * Create event mutation (Admin only)
 */
export function useCreateEvent() {
  // const api = useApi();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_data: any) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(_data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create event');
      }
      return response.json();

      // Implement API call to POST /api/events
      // throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * Update event mutation (Admin only)
 */
export function useUpdateEvent() {
  // const api = useApi();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    // add appropriate parameter to async
    mutationFn: async ({ id, data }: any) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update event');
      }
      return response.json();
      // Implement API call to PUT /api/events/:id
      // throw new Error('Not implemented');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * Publish event mutation (Admin only)
 */
export function usePublishEvent() {
  // const api = useApi();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_eventId: string) => {
      // Implement API call to POST /api/events/:id/publish
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events/${_eventId}/publish`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to publish event');
      }
      return response.json();
      // throw new Error('Not implemented');
    },
    onSuccess: (_, eventId) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * Delete event mutation (Admin only)
 */
export function useDeleteEvent() {
  // const api = useApi();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_eventId: string) => {
      // Implement API call to DELETE /api/events/:id
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events/${_eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete event');
      }
      return response.json();
      // throw new Error('Not implemented');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}

/**
 * RSVP to event mutation
 */
export function useRSVP() {
  // const api = useApi();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId }: any) => {
      // Implement API call to POST /api/events/:eventId/rsvp
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events/${eventId}/rsvp`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to RSVP to event');
      }
      return response.json();
      // throw new Error('Not implemented');
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['event', variables.eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['my-rsvps'] });
    },
  });
}
