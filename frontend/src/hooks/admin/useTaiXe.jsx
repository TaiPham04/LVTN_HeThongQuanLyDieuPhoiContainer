import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useTaiXeList() {
  return useQuery({
    queryKey: ['tai-xe'],
    queryFn: () => api.get('/admin/tai-xe').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
