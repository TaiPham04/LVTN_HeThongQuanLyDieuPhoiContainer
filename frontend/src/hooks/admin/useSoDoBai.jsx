import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'so-do-bai';

export function useSoDoBaiList() {
  return useQuery({
    queryKey: [KEY, 'list'],
    queryFn: () => api.get('/admin/so-do-bai').then(r => r.data),
    staleTime: 60_000,
  });
}

export function useSoDoBai(makhuvuc) {
  return useQuery({
    queryKey: [KEY, makhuvuc],
    queryFn: () => api.get(`/admin/so-do-bai/${makhuvuc}`).then(r => r.data),
    enabled: !!makhuvuc,
    staleTime: 30_000,
  });
}

export function useChoGanViTri() {
  return useQuery({
    queryKey: [KEY, 'cho-gan-vitri'],
    queryFn: () => api.get('/admin/so-do-bai/cho-gan-vitri').then(r => r.data),
    staleTime: 15_000,
  });
}

export function useGoiYViTri(macontainer) {
  return useQuery({
    queryKey: [KEY, 'goi-y-vitri', macontainer],
    queryFn: () => api.get(`/admin/so-do-bai/goi-y-vitri/${macontainer}`).then(r => r.data),
    enabled: !!macontainer,
  });
}

export function useGoiYDaoChuyen(maobai) {
  return useQuery({
    queryKey: [KEY, 'goi-y-daochuyen', maobai],
    queryFn: () => api.get(`/admin/so-do-bai/goi-y-daochuyen/${maobai}`).then(r => r.data),
    enabled: !!maobai,
  });
}

export function useGanViTri() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/admin/so-do-bai/gan-vitri', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDaoChuyen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/admin/so-do-bai/daochuyen', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
