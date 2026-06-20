import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'logcong';

export function useLogCongList({ trang = 1, search = '', kieu_xuatnhap = '', ngay = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, kieu_xuatnhap, ngay, per_page],
    queryFn: () =>
      api.get('/admin/cong', { params: { trang, search, kieu_xuatnhap, ngay, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useGhiNhanXuatNhap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/cong', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['container'] });
    },
  });
}
