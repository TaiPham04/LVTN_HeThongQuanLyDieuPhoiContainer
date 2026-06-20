import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'nv-bai-sodobai';

export function useNVSoDoBaiList() {
  return useQuery({
    queryKey: [KEY, 'list'],
    queryFn: () => api.get('/nv/bai/so-do-bai').then(r => r.data),
    staleTime: 60_000,
  });
}

export function useNVSoDoBai(makhuvuc) {
  return useQuery({
    queryKey: [KEY, makhuvuc],
    queryFn: () => api.get(`/nv/bai/so-do-bai/${makhuvuc}`).then(r => r.data),
    enabled: !!makhuvuc,
    staleTime: 30_000,
  });
}

export function useNVChoGanViTri() {
  return useQuery({
    queryKey: [KEY, 'cho-gan-vitri'],
    queryFn: () => api.get('/nv/bai/so-do-bai/cho-gan-vitri').then(r => r.data),
    staleTime: 15_000,
  });
}

export function useNVGoiYViTri(macontainer) {
  return useQuery({
    queryKey: [KEY, 'goi-y-vitri', macontainer],
    queryFn: () => api.get(`/nv/bai/so-do-bai/goi-y-vitri/${macontainer}`).then(r => r.data),
    enabled: !!macontainer,
  });
}

export function useNVGoiYDaoChuyen(maobai) {
  return useQuery({
    queryKey: [KEY, 'goi-y-daochuyen', maobai],
    queryFn: () => api.get(`/nv/bai/so-do-bai/goi-y-daochuyen/${maobai}`).then(r => r.data),
    enabled: !!maobai,
  });
}

export function useNVGanViTri() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/nv/bai/so-do-bai/gan-vitri', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useNVDaoChuyen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/nv/bai/so-do-bai/daochuyen', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
