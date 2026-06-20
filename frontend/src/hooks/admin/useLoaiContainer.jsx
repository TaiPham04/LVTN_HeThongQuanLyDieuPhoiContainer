import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'loai-container';

export function useLoaiContainerList(params = {}) {
  return useQuery({
    queryKey: [KEY, params],
    queryFn: async () => {
      const { data } = await api.get('/admin/loai-container', { params });
      return data;
    },
  });
}

export function useThemLoaiContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/admin/loai-container', payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCapNhatLoaiContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ maloai, ...payload }) =>
      api.put(`/admin/loai-container/${maloai}`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useXoaLoaiContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ maloai, lydo_xoa, xacnhan_xoa }) =>
      api.delete(`/admin/loai-container/${maloai}`, {
        data: { lydo_xoa, xacnhan_xoa },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useKhoiPhucLoaiContainer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (maloai) =>
      api.patch(`/admin/loai-container/${maloai}/khoiphuc`),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}