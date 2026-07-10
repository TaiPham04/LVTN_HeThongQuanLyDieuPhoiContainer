import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-bai-container';
const KEY_TALLY = 'nv-bai-tally';

export function useContainerBaiList({ trang = 1, search = '', trangthai = '', machuyentau = '', loai_hinh = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, machuyentau, loai_hinh, per_page],
    queryFn: () =>
      api.get('/nv/bai/container', { params: { trang, search, trangthai, machuyentau, loai_hinh, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useTallyDanhSach(machuyentau) {
  return useQuery({
    queryKey: [KEY_TALLY, machuyentau],
    queryFn: () => api.get(`/nv/bai/tally/${machuyentau}`).then(r => r.data),
    enabled: !!machuyentau,
    refetchInterval: 30_000,
  });
}

export function useTallyXacNhan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (macontainer) => api.patch(`/nv/bai/tally/${macontainer}/xac-nhan`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY_TALLY] }),
  });
}

export function useTallyXacNhanLoat() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (machuyentau) => api.post(`/nv/bai/tally/${machuyentau}/xac-nhan-loat`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY_TALLY] });
      qc.invalidateQueries({ queryKey: ['nv-bai-lichtau'] });
    },
  });
}

export function useTallyCapNhatTinhTrang() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ macontainer, bi_hong, ghichu_hong }) =>
      api.patch(`/nv/bai/tally/${macontainer}/tinh-trang`, { bi_hong, ghichu_hong }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY_TALLY] }),
  });
}
