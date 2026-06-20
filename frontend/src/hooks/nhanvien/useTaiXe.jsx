import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useTaiXeListCong() {
  return useQuery({
    queryKey: ['nv-cong-tai-xe'],
    queryFn: () => api.get('/nv/cong/tai-xe').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}
