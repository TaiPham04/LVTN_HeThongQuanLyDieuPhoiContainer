import { useMutation } from '@tanstack/react-query';
import api from '@/lib/axios';

export function useCapNhatProfile() {
  return useMutation({
    mutationFn: (payload) => api.put('/auth/profile', payload).then(r => r.data),
  });
}

export function useDoiMatKhau() {
  return useMutation({
    mutationFn: (payload) => api.put('/auth/password', payload).then(r => r.data),
  });
}
