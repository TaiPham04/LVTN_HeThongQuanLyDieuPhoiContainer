import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'kh-dashboard';

export function useDashboardKH() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get('/kh/dashboard').then(r => r.data),
  });
}
