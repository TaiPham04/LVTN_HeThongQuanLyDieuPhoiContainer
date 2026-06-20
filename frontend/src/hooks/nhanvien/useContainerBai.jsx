import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-bai-container';

export function useContainerBaiList({ trang = 1, search = '', trangthai = '', mahangtau = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, mahangtau, per_page],
    queryFn: () =>
      api.get('/nv/bai/container', { params: { trang, search, trangthai, mahangtau, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}
