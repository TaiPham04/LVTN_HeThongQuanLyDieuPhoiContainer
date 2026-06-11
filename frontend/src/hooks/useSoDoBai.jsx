import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'so-do-bai';

export function useSoDoBaiList() {
  return useQuery({
    queryKey: [KEY, 'list'],
    queryFn: () => api.get('/admin/so-do-bai').then(r => r.data),
    staleTime: 60_000,
  });
}

export function useSoDoBai(makhuvuc) {
  return useQuery({
    queryKey: [KEY, makhuvuc],
    queryFn: () => api.get(`/admin/so-do-bai/${makhuvuc}`).then(r => r.data),
    enabled: !!makhuvuc,
    staleTime: 30_000,
  });
}
