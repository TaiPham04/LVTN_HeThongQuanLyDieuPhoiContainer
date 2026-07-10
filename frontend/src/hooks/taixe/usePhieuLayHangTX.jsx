import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

export function usePhieuLayHangTX(trangthai = '') {
  return useQuery({
    queryKey: ['tx-phieu', trangthai],
    queryFn: () =>
      api.get('/tx/phieu-lay-hang', { params: trangthai ? { trangthai } : {} })
        .then(r => r.data),
  });
}

export function usePhieuLayHangTXDetail(maphieu) {
  return useQuery({
    queryKey: ['tx-phieu', maphieu],
    queryFn: () => api.get(`/tx/phieu-lay-hang/${maphieu}`).then(r => r.data),
    enabled: !!maphieu,
  });
}
