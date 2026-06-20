import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'khu-vuc-bai';

export function useKhuVucBaiList({ trang = 1, search = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, per_page],
    queryFn: () =>
      api.get('/admin/khu-vuc-bai', { params: { trang, search, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useThemKhuVucBai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/khu-vuc-bai', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatKhuVucBai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ makhuvuc, ...payload }) =>
      api.put(`/admin/khu-vuc-bai/${makhuvuc}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useXoaKhuVucBai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ makhuvuc, ...payload }) =>
      api.delete(`/admin/khu-vuc-bai/${makhuvuc}`, { data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}