import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'bien-ban-ktd';

export function useBienBanKTDList({ trang = 1, search = '', loaiktd = '', ketluan = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, loaiktd, ketluan, per_page],
    queryFn: () =>
      api.get('/admin/bien-ban-ktd', { params: { trang, search, loaiktd, ketluan, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useLuuBienBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/bien-ban-ktd', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['container'] });
    },
  });
}
