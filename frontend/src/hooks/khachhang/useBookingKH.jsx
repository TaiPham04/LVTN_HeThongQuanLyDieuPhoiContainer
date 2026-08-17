import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const KEY = 'kh-booking';
const LICH_TAU_KEY = 'kh-lich-tau';

export function useBookingKHList({ trang = 1, search = '', trangthai = '', per_page = 10 } = {}) {
  return useQuery({
    queryKey: [KEY, trang, search, trangthai, per_page],
    queryFn: () =>
      api.get('/kh/booking', { params: { trang, search, trangthai, per_page } }).then(r => r.data),
    keepPreviousData: true,
  });
}

export function useLichTauKH() {
  return useQuery({
    queryKey: [LICH_TAU_KEY],
    queryFn: () => api.get('/kh/lich-tau').then(r => r.data),
  });
}

export function useLoaiContainerKH() {
  return useQuery({
    queryKey: ['kh-loai-container'],
    queryFn: () => api.get('/kh/loai-container').then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// Tra cứu loại/kích thước nếu số container này đã từng có trong hệ thống —
// dùng để tự điền tiện lợi, gọi thủ công (không phải query tự động theo key).
export function traCuuLoaiContainer(socontainer) {
  return api.get('/kh/booking/tra-cuu-loai', { params: { socontainer } }).then(r => r.data);
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data) => api.post('/kh/booking', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['kh-dashboard'] });
    },
  });
}

export function useHuyBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (macontainer) => api.patch(`/kh/booking/${macontainer}/huy`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ['kh-dashboard'] });
    },
  });
}
