import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'lich-tau';

export function useChuyenTauList({ trang = 1, search = '', trangthai = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, per_page],
    queryFn: () =>
      api.get('/admin/lich-tau', { params: { trang, search, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useThemChuyenTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/lich-tau', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatChuyenTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ machuyentau, ...payload }) =>
      api.put(`/admin/lich-tau/${machuyentau}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useHuyChuyenTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ machuyentau, ...payload }) =>
      api.delete(`/admin/lich-tau/${machuyentau}`, { data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useChuyenTrangThai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (machuyentau) => api.patch(`/admin/lich-tau/${machuyentau}/trang-thai`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
