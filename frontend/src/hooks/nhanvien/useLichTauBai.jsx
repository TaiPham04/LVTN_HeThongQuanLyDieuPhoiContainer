import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-bai-lichtau';

export function useLichTauBaiList({ trang = 1, search = '', trangthai = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, per_page],
    queryFn: () =>
      api.get('/nv/bai/lich-tau', { params: { trang, search, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useChuyenTrangThaiBai() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (machuyentau) =>
      api.patch(`/nv/bai/lich-tau/${machuyentau}/trang-thai`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
