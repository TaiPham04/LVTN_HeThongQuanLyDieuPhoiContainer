import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-cong-container';

export function useContainerCongList({ trang = 1, search = '', trangthai = '', mahangtau = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, mahangtau, per_page],
    queryFn: () =>
      api.get('/nv/cong/container', { params: { trang, search, trangthai, mahangtau, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useContainerCongLookup(socontainer) {
  return useQuery({
    queryKey: [KEY, 'lookup', socontainer],
    queryFn: () =>
      api.get('/nv/cong/container/lookup', { params: { socontainer } }).then(r => r.data),
    enabled: !!socontainer && socontainer.length >= 11,
    staleTime: 30_000,
  });
}

export function useDangKyContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/nv/cong/container', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatHaiQuanCong() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ macontainer, ...payload }) =>
      api.patch(`/nv/cong/container/${macontainer}/hai-quan`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
