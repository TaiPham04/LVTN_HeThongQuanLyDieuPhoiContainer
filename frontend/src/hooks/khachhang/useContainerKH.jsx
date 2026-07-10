import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'kh-container';

export function useContainerKHList({ trang = 1, search = '', trangthai = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, per_page],
    queryFn: () =>
      api.get('/kh/container', { params: { trang, search, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useContainerKHDetail(macontainer) {
  return useQuery({
    queryKey: [KEY, 'detail', macontainer],
    queryFn: () => api.get(`/kh/container/${macontainer}`).then(r => r.data),
    enabled: !!macontainer,
  });
}
