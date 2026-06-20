import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-cong-bienbankt';

export function useBienBanKTList({ trang = 1, search = '', loaiktd = '', ketluan = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, loaiktd, ketluan, per_page],
    queryFn: () =>
      api.get('/nv/cong/bien-ban-kt', { params: { trang, search, loaiktd, ketluan, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useLuuBienBan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/nv/cong/bien-ban-kt', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['nv-cong-container'] });
    },
  });
}
