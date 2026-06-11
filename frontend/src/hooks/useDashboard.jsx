import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
    staleTime: 60_000,
  });
}
