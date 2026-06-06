import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'hang-tau';

export function useHangTauList(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get('/admin/hang-tau', { params });
      return data;
    },
  });
}

export function useThemHangTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/hang-tau', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatHangTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mahangtau, ...payload }) =>
      api.put(`/admin/hang-tau/${mahangtau}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useXoaHangTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mahangtau, lydo_xoa, xacnhan_xoa }) =>
      api.delete(`/admin/hang-tau/${mahangtau}`, {
        data: { lydo_xoa, xacnhan_xoa },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useKhoiPhucHangTau() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mahangtau) =>
      api.patch(`/admin/hang-tau/${mahangtau}/khoiphuc`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}