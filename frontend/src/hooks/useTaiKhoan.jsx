import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'tai-khoan';

export function useTaiKhoanList({ trang = 1, search = '', mavaitro = '', trangthai = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, mavaitro, trangthai, per_page],
    queryFn: () =>
      api.get('/admin/tai-khoan', { params: { trang, search, mavaitro, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useThemTaiKhoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/tai-khoan', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatTaiKhoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mataikhoan, ...payload }) =>
      api.put(`/admin/tai-khoan/${mataikhoan}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useVoHieuHoa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mataikhoan) => api.patch(`/admin/tai-khoan/${mataikhoan}/vo-hieu-hoa`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useKhoiPhuc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mataikhoan) => api.patch(`/admin/tai-khoan/${mataikhoan}/khoiphuc`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useResetMatKhau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mataikhoan, ...payload }) =>
      api.patch(`/admin/tai-khoan/${mataikhoan}/reset-mat-khau`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
