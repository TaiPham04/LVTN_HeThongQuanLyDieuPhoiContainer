import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'kh-tai-xe';

export function useTaiXeKHList() {
  return useQuery({
    queryKey: [KEY],
    queryFn: () => api.get('/kh/tai-xe').then(r => r.data),
  });
}

export function useCreateTaiXeKH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/kh/tai-xe', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateTaiXeKH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mataixe, ...data }) => api.patch(`/kh/tai-xe/${mataixe}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteTaiXeKH() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mataixe) => api.delete(`/kh/tai-xe/${mataixe}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDoiMatKhauTaiXeKH() {
  return useMutation({
    mutationFn: ({ mataixe, password }) =>
      api.patch(`/kh/tai-xe/${mataixe}/mat-khau`, { password }).then(r => r.data),
  });
}
