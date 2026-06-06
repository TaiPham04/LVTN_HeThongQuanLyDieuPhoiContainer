import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'container';

export function useContainerList({ trang = 1, search = '', trangthai = '', mahangtau = '', maloai = '', per_page = 15 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, mahangtau, maloai, per_page],
    queryFn: () =>
      api.get('/admin/container', { params: { trang, search, trangthai, mahangtau, maloai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useThemContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/container', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ macontainer, ...payload }) =>
      api.put(`/admin/container/${macontainer}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useContainerLookup(socontainer) {
  return useQuery({
    queryKey: ['container-lookup', socontainer],
    queryFn: () =>
      api.get('/admin/container/lookup', { params: { socontainer } }).then(r => r.data),
    enabled: !!socontainer && socontainer.length >= 11,
    staleTime: 30_000,
  });
}

export function useXoaContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ macontainer, ...payload }) =>
      api.delete(`/admin/container/${macontainer}`, { data: payload }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
