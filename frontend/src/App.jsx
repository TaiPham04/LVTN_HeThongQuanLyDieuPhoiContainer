import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@/store/authStore';
import LoginPage from '@/pages/auth/LoginPage';
import AdminLayout from '@/layouts/AdminLayout';
import LoaiContainerPage from '@/pages/admin/LoaiContainerPage';
import HangTauPage from '@/pages/admin/HangTauPage';
import KhuVucBaiPage from '@/pages/admin/KhuVucBaiPage';
import LichTauPage from '@/pages/admin/LichTauPage';
import ContainerPage from '@/pages/admin/ContainerPage';
import TaiKhoanPage from '@/pages/admin/TaiKhoanPage';
import CongXuatNhapPage from '@/pages/admin/CongXuatNhapPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function RootRedirect() {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  switch (user?.role) {
    case 'admin':
    case 'nhanvien': return <Navigate to="/admin/dashboard" replace />;
    case 'khachhang': return <Navigate to="/customer/containers" replace />;
    case 'taixe':    return <Navigate to="/driver/trips" replace />;
    default:         return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Placeholder — sẽ bổ sung khi làm từng module */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin','nhanvien']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route path="khu-vuc-bai" element={<KhuVucBaiPage />} />
            <Route path="lich-tau" element={<LichTauPage />} />
            <Route path="container" element={<ContainerPage />} />
            <Route path="tai-khoan" element={<TaiKhoanPage />} />
            <Route path="cong" element={<CongXuatNhapPage />} />
            <Route path="hang-tau" element={<HangTauPage />} />
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<div style={{padding:20}}>Dashboard coming soon</div>} />
            <Route path="loai-container" element={<LoaiContainerPage />} />
          </Route>
          <Route path="/customer/*" element={
            <ProtectedRoute allowedRoles={['khachhang']}>
              <div style={{padding:40}}>Customer — coming soon</div>
            </ProtectedRoute>
          }/>
          <Route path="/driver/*"   element={
            <ProtectedRoute allowedRoles={['taixe']}>
              <div style={{padding:40}}>Driver — coming soon</div>
            </ProtectedRoute>
          }/>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}