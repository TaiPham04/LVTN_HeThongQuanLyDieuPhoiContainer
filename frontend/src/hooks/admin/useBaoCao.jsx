import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'bao-cao';

export function useBaoCaoXuatNhap(params) {
  return useQuery({
    queryKey: [KEY, 'xuat-nhap', params],
    queryFn: () => api.get('/admin/bao-cao/xuat-nhap', { params }).then(r => r.data),
    staleTime: 30_000,
    keepPreviousData: true,
  });
}

export function useBaoCaoContainer(params) {
  return useQuery({
    queryKey: [KEY, 'container', params],
    queryFn: () => api.get('/admin/bao-cao/container', { params }).then(r => r.data),
    staleTime: 30_000,
    keepPreviousData: true,
  });
}

export function useBaoCaoHangTau(params) {
  return useQuery({
    queryKey: [KEY, 'hang-tau', params],
    queryFn: () => api.get('/admin/bao-cao/hang-tau', { params }).then(r => r.data),
    staleTime: 30_000,
  });
}
