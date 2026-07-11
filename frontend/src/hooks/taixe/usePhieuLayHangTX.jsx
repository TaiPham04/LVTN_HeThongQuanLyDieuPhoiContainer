import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'tx-phieu';

export function usePhieuLayHangTX(trangthai = '') {
  return useQuery({
    queryKey: [KEY, trangthai],
    queryFn: () =>
      api.get('/tx/phieu-lay-hang', { params: trangthai ? { trangthai } : {} })
        .then(r => r.data),
  });
}

export function usePhieuLayHangTXDetail(maphieu) {
  return useQuery({
    queryKey: [KEY, maphieu],
    queryFn: () => api.get(`/tx/phieu-lay-hang/${maphieu}`).then(r => r.data),
    enabled: !!maphieu,
  });
}

export function useDenCangTX() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maphieu) =>
      api.patch(`/tx/phieu-lay-hang/${maphieu}/den-cang`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useLayHangTX() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maphieu) =>
      api.patch(`/tx/phieu-lay-hang/${maphieu}/lay-hang`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
