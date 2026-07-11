import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from '@/store/authStore';

// ── Auth ──────────────────────────────────────────────────────────
import LoginPage from '@/pages/auth/LoginPage';

// ── Admin layout + pages ──────────────────────────────────────────
import AdminLayout from '@/layouts/AdminLayout';
import DashboardPage from '@/pages/admin/DashboardPage';
import LoaiContainerPage from '@/pages/admin/LoaiContainerPage';
import HangTauPage from '@/pages/admin/HangTauPage';
import KhuVucBaiPage from '@/pages/admin/KhuVucBaiPage';
import LichTauPage from '@/pages/admin/LichTauPage';
import ContainerPage from '@/pages/admin/ContainerPage';
import TaiKhoanPage from '@/pages/admin/TaiKhoanPage';
import CongXuatNhapPage from '@/pages/admin/CongXuatNhapPage';
import SoDoBaiPage from '@/pages/admin/SoDoBaiPage';
import BaoCaoPage from '@/pages/admin/BaoCaoPage';
import BienBanKTPage from '@/pages/admin/BienBanKTPage';
import ManifestPage from '@/pages/admin/ManifestPage';
import TraCuuContainerPage from '@/pages/admin/TraCuuContainerPage';

// ── NhanVien layout + pages ───────────────────────────────────────
import NhanVienLayout from '@/layouts/NhanVienLayout';
import ContainerCongPage from '@/pages/nhanvien/cong/ContainerPage';
import LichTauCongPage from '@/pages/nhanvien/cong/LichTauPage';
import CongXuatNhapNVPage from '@/pages/nhanvien/cong/CongXuatNhapPage';
import BienBanKTCongPage from '@/pages/nhanvien/cong/BienBanKTPage';
import PhieuLayHangPage from '@/pages/nhanvien/cong/PhieuLayHangPage';
import ScanQRPage from '@/pages/nhanvien/cong/ScanQRPage';
import ContainerBaiPage from '@/pages/nhanvien/bai/ContainerPage';
import LichTauBaiPage from '@/pages/nhanvien/bai/LichTauPage';
import SoDoBaiNVPage from '@/pages/nhanvien/bai/SoDoBaiPage';
import TiepNhanNhapPage from '@/pages/nhanvien/bai/TiepNhanNhapPage';
import BienBanKTBaiPage from '@/pages/nhanvien/bai/BienBanKTPage';

// ── Tài xế layout + pages ────────────────────────────────────────
import TaiXeLayout from '@/layouts/TaiXeLayout';
import PhieuLayHangTXPage from '@/pages/taixe/PhieuLayHangPage';

// ── KhachHang layout + pages ──────────────────────────────────────
import KhachHangLayout from '@/layouts/KhachHangLayout';
import DashboardKHPage from '@/pages/khachhang/DashboardPage';
import BookingKHPage from '@/pages/khachhang/BookingPage';
import ContainerKHPage from '@/pages/khachhang/ContainerPage';
import PhieuLayHangKHPage from '@/pages/khachhang/PhieuLayHangPage';
import TaiXeKHPage from '@/pages/khachhang/TaiXePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
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
    case 'admin':          return <Navigate to="/admin/dashboard" replace />;
    case 'nhanvien_cong':  return <Navigate to="/nv/cong/cong" replace />;
    case 'nhanvien_bai':   return <Navigate to="/nv/bai/so-do-bai" replace />;
    case 'khachhang':      return <Navigate to="/kh/dashboard" replace />;
    case 'taixe':          return <Navigate to="/driver/phieu-lay-hang" replace />;
    default:               return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/"      element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* ── Admin ── */}
          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"      element={<DashboardPage />} />
            <Route path="loai-container" element={<LoaiContainerPage />} />
            <Route path="hang-tau"       element={<HangTauPage />} />
            <Route path="khu-vuc-bai"    element={<KhuVucBaiPage />} />
            <Route path="lich-tau"       element={<LichTauPage />} />
            <Route path="container"      element={<ContainerPage />} />
            <Route path="tai-khoan"      element={<TaiKhoanPage />} />
            <Route path="cong"           element={<CongXuatNhapPage />} />
            <Route path="bien-ban-kt"   element={<BienBanKTPage />} />
            <Route path="so-do-bai"      element={<SoDoBaiPage />} />
            <Route path="bao-cao"        element={<BaoCaoPage />} />
            <Route path="manifest"       element={<ManifestPage />} />
            <Route path="tra-cuu"        element={<TraCuuContainerPage />} />
          </Route>

          {/* ── Nhân viên cổng ── */}
          <Route path="/nv/cong" element={
            <ProtectedRoute allowedRoles={['nhanvien_cong']}>
              <NhanVienLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="scan-qr" replace />} />
            <Route path="scan-qr"        element={<ScanQRPage />} />
            <Route path="container"      element={<ContainerCongPage />} />
            <Route path="cong"           element={<CongXuatNhapNVPage />} />
            <Route path="phieu-lay-hang" element={<PhieuLayHangPage />} />
            <Route path="bien-ban-kt"   element={<BienBanKTCongPage />} />
          </Route>

          {/* ── Nhân viên bãi ── */}
          <Route path="/nv/bai" element={
            <ProtectedRoute allowedRoles={['nhanvien_bai']}>
              <NhanVienLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="so-do-bai" replace />} />
            <Route path="container"       element={<ContainerBaiPage />} />
            <Route path="tiep-nhan-nhap"  element={<TiepNhanNhapPage />} />
            <Route path="lich-tau"        element={<LichTauBaiPage />} />
            <Route path="so-do-bai"       element={<SoDoBaiNVPage />} />
            <Route path="bien-ban-kt"     element={<BienBanKTBaiPage />} />
          </Route>

          {/* ── Khách hàng ── */}
          <Route path="/kh" element={
            <ProtectedRoute allowedRoles={['khachhang']}>
              <KhachHangLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"      element={<DashboardKHPage />} />
            <Route path="booking"        element={<BookingKHPage />} />
            <Route path="containers"     element={<ContainerKHPage />} />
            <Route path="phieu-lay-hang" element={<PhieuLayHangKHPage />} />
            <Route path="tai-xe"         element={<TaiXeKHPage />} />
          </Route>

          {/* ── Tài xế ── */}
          <Route path="/driver" element={
            <ProtectedRoute allowedRoles={['taixe']}>
              <TaiXeLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="phieu-lay-hang" replace />} />
            <Route path="phieu-lay-hang" element={<PhieuLayHangTXPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
