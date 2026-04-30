import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { me } from '../api/auth.api.js';
import { useAuthStore } from '../store/authStore.js';

export function useBootstrapAuth() {
  const { token, setUser, logout } = useAuthStore();

  const { data, isError } = useQuery({
    queryKey: ['me'],
    queryFn: me,
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (data) setUser(data);
    if (isError) logout();
  }, [data, isError, setUser, logout]);
}
