import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-cong-phieu-lay-hang';

export function usePhieuLayHangList({ trang = 1, search = '', trangthai = '', ngay = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, ngay, per_page],
    queryFn: () =>
      api.get('/nv/cong/phieu-lay-hang', { params: { trang, search, trangthai, ngay, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useTaoPhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/nv/cong/phieu-lay-hang', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useXacNhanDaLay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maphieu) => api.patch(`/nv/cong/phieu-lay-hang/${maphieu}/xac-nhan`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useHuyPhieu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maphieu) => api.patch(`/nv/cong/phieu-lay-hang/${maphieu}/huy`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
    },
  });
}

export function useScanQR() {
  return useMutation({
    mutationFn: (ma_qr) =>
      api.get('/nv/cong/phieu-lay-hang/scan-qr', { params: { ma_qr } }).then(r => r.data),
  });
}

export function useVaoCong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ maphieu, bienso_romo }) =>
      api.patch(`/nv/cong/phieu-lay-hang/${maphieu}/vao-cong`, { bienso_romo }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
