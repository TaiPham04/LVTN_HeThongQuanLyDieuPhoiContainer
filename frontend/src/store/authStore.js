import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/login', { email, password });
          localStorage.setItem('auth_token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return { success: true, user: data.user };
        } catch (error) {
          set({ isLoading: false });
          const message =
            error.response?.data?.message ||
            error.response?.data?.errors?.email?.[0] ||
            'Đăng nhập thất bại.';
          return { success: false, message };
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const { data } = await api.post('/auth/register', formData);
          localStorage.setItem('auth_token', data.token);
          set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Đăng ký thất bại.',
            errors: error.response?.data?.errors || {},
          };
        }
      },

      logout: async () => {
        try { await api.post('/auth/logout'); } catch {}
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
      },

      isAdmin:     () => get().user?.role === 'admin',
      isStaff:     () => get().user?.role === 'nhanvien',
      isCustomer:  () => get().user?.role === 'khachhang',
      isDriver:    () => get().user?.role === 'taixe',
    }),
    {
      name: 'logicon-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;