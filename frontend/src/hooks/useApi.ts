import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../config/api';

export const useApi = () => {
  const { getToken } = useAuth();

  const request = async (url: string, options: RequestInit = {}) => {
    const token = await getToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }

    if (response.status === 204) return null;
    return response.json();
  };

  return {
    get: (url: string) => request(url, { method: 'GET' }),
    post: (url: string, data?: any) => request(url, { method: 'POST', body: JSON.stringify(data) }),
    put: (url: string, data?: any) => request(url, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (url: string) => request(url, { method: 'DELETE' }),
  };
};
