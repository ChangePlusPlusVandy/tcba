import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { API_BASE_URL } from '../../config/api';

export const useBlogMutations = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const createBlog = useMutation({
    mutationFn: async (data: any) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/blogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to create blog');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

  const updateBlog = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update blog');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

  const deleteBlog = useMutation({
    mutationFn: async (id: string) => {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/blogs/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete blog');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blogs'] });
    },
  });

  return { createBlog, updateBlog, deleteBlog };
};
