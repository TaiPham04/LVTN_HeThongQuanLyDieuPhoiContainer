import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-bai-bienbankt';

export function useBienBanKTBaiList({ trang = 1, search = '', ketluan = '', chu_ky = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, ketluan, chu_ky, per_page],
    queryFn: () =>
      api.get('/nv/bai/bien-ban-kt', { params: { trang, search, ketluan, chu_ky, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useLuuBienBanDinhKy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/nv/bai/bien-ban-kt', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['nv-bai-container'] });
    },
  });
}
