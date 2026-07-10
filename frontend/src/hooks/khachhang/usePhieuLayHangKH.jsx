import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'kh-phieu-lay-hang';

export function usePhieuLayHangKHList({ trang = 1, search = '', trangthai = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, per_page],
    queryFn: () =>
      api.get('/kh/phieu-lay-hang', { params: { trang, search, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function usePhieuLayHangKHDetail(maphieu) {
  return useQuery({
    queryKey: [KEY, 'detail', maphieu],
    queryFn: () => api.get(`/kh/phieu-lay-hang/${maphieu}`).then(r => r.data),
    enabled: !!maphieu,
  });
}

export function useContainerTrongBaiKH() {
  return useQuery({
    queryKey: ['kh-container-trong-bai'],
    queryFn: () => api.get('/kh/container-trong-bai').then(r => r.data),
  });
}

export function useCreatePhieuLayHangKH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/kh/phieu-lay-hang', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['kh-container-trong-bai'] });
      qc.invalidateQueries({ queryKey: ['kh-dashboard'] });
    },
  });
}

export function useHuyPhieuLayHangKH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maphieu) => api.patch(`/kh/phieu-lay-hang/${maphieu}/huy`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['kh-dashboard'] });
    },
  });
}
