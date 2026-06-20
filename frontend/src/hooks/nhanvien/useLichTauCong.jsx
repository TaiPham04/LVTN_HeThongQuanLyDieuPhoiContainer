import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-cong-lichtau';

export function useLichTauCongList({ trang = 1, search = '', trangthai = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, per_page],
    queryFn: () =>
      api.get('/nv/cong/lich-tau', { params: { trang, search, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useChuyenTrangThaiCong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (machuyentau) => api.patch(`/nv/cong/lich-tau/${machuyentau}/trang-thai`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
