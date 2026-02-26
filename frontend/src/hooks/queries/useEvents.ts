import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../config/api';

export type Event = {
  id: string;
  title: string;
  description: string;
  location?: string;
  zoomLink?: string;
  meetingPassword?: string;
  startTime: string;
  endTime: string;
  timezone: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED' | 'COMPLETED';
  isPublic: boolean;
  maxAttendees?: number;
  tags: string[];
  attachments: string[];
  createdByAdminId: string;
  createdByAdmin: {
    id: string;
    name: string;
    email: string;
  };
  rsvpCount: number;
  orgRsvpCount: number;
  publicRsvpCount: number;
  createdAt: string;
  updatedAt: string;
};

/**
 * Fetch all events (with optional filters)
 */
export function useEvents(filters?: { status?: string; upcoming?: boolean; isPublic?: boolean }) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['events', filters],
    queryFn: async () => {
      const token = await getToken();
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.upcoming) params.append('upcoming', 'true');
      if (filters?.isPublic !== undefined) params.append('isPublic', String(filters.isPublic));

      const response = await fetch(`${API_BASE_URL}/api/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }

      return response.json() as Promise<Event[]>;
    },
  });
}

/**
 * Fetch public events (no auth required)
 */
export function usePublicEvents(upcomingOnly: boolean = true) {
  return useQuery({
    queryKey: ['events', 'public', upcomingOnly],
    queryFn: async () => {
      const params = upcomingOnly ? '?upcoming=true' : '';
      const response = await fetch(`${API_BASE_URL}/api/events/public${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch public events');
      }

      return response.json() as Promise<Event[]>;
    },
  });
}

/**
 * Fetch single event by ID
 */
export function useEvent(id: string) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      return response.json() as Promise<Event>;
    },
    enabled: !!id,
  });
}

/**
 * Fetch single public event by ID (no auth required)
 */
export function usePublicEvent(id: string) {
  return useQuery({
    queryKey: ['event', 'public', id],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/api/events/public/${id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch event');
      }

      return response.json() as Promise<Event>;
    },
    enabled: !!id,
  });
}

/**
 * Get current user's RSVPs
 */
export function useMyRSVPs() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['my-rsvps'],
    queryFn: async () => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/events/my/rsvps`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch RSVPs');
      }

      return response.json();
    },
  });
}
