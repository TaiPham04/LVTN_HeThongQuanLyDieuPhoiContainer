import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

const MENU_CONG = [
  { path: '/nv/cong/scan-qr',        icon: 'ti-qrcode',         label: 'Quét mã QR' },
  { path: '/nv/cong/container',      icon: 'ti-package',        label: 'Container' },
  { path: '/nv/cong/cong',           icon: 'ti-door-enter',     label: 'Xuất nhập cổng' },
  { path: '/nv/cong/phieu-lay-hang', icon: 'ti-ticket',         label: 'Phiếu lấy hàng' },
  { path: '/nv/cong/bien-ban-kt',   icon: 'ti-clipboard-check', label: 'Biên bản KT' },
];

const MENU_BAI = [
  { path: '/nv/bai/tiep-nhan-nhap', icon: 'ti-ship',            label: 'Tiếp nhận nhập' },
  { path: '/nv/bai/container',      icon: 'ti-package',         label: 'Container' },
  { path: '/nv/bai/lich-tau',       icon: 'ti-calendar-event',  label: 'Lịch tàu' },
  { path: '/nv/bai/so-do-bai',      icon: 'ti-layout-grid',     label: 'Sơ đồ bãi' },
  { path: '/nv/bai/bien-ban-kt',    icon: 'ti-clipboard-list',  label: 'Kiểm tra định kỳ' },
];

const ROLE_LABEL = {
  nhanvien_cong: 'Nhân viên cổng',
  nhanvien_bai:  'Nhân viên bãi',
};

export default function NhanVienLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const goTo = (path) => {
    navigate(path);
    setSidebarOpen(false);
  };

  const menu = user?.role === 'nhanvien_cong' ? MENU_CONG : MENU_BAI;
  const allMenu = [...MENU_CONG, ...MENU_BAI];

  const vietTat = user?.hoten
    ? user.hoten.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'NV';

  const tenTrang = allMenu.find(m => location.pathname.startsWith(m.path))?.label || 'Trang chủ';

  return (
    <div style={s.root}>
      <style>{`
        @media (max-width: 767px) {
          .nv-sidebar {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            height: 100vh !important;
            z-index: 50 !important;
            transform: translateX(${sidebarOpen ? '0' : '-100%'}) !important;
            transition: transform .2s ease;
          }
        }
      `}</style>

      {/* ─── BACKDROP (mobile) ─── */}
      {sidebarOpen && (
        <div
          className="md:hidden"
          style={s.backdrop}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ─── SIDEBAR ─── */}
      <aside className="nv-sidebar" style={s.sidebar}>
        {/* Logo */}
        <div style={s.logo}>
          <div style={s.logoBox}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2"/>
              <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
            </svg>
          </div>
          <span style={s.logoName}>LogiCon</span>
        </div>

        <div style={s.divider} />

        {/* Role badge */}
        <div style={s.roleBadge}>{ROLE_LABEL[user?.role] || 'Nhân viên'}</div>

        {/* Menu */}
        <nav style={s.nav}>
          {menu.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                onClick={() => goTo(item.path)}
                style={{ ...s.navItem, ...(isActive ? s.navActive : {}) }}
              >
                <i className={`ti ${item.icon}`} aria-hidden="true"
                  style={{ fontSize: 17, flexShrink: 0 }} />
                <span style={s.navLabel}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Đăng xuất */}
        <div style={s.sidebarFooter}>
          <div onClick={handleLogout} style={s.navItem}>
            <i className="ti ti-logout" aria-hidden="true" style={{ fontSize: 17 }} />
            <span style={s.navLabel}>Đăng xuất</span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div style={s.main}>
        {/* Header */}
        <header style={s.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="flex md:hidden"
              onClick={() => setSidebarOpen(true)}
              style={s.hamburger}
              type="button"
              aria-label="Mở menu"
            >
              <i className="ti ti-menu-2" style={{ fontSize: 20 }} />
            </button>
            <span style={s.breadcrumb}>{tenTrang}</span>
          </div>
          <div
            style={{ ...s.headerRight, cursor: 'pointer' }}
            onClick={() => navigate(`/nv/${user?.role === 'nhanvien_cong' ? 'cong' : 'bai'}/profile`)}
            title="Thông tin cá nhân"
          >
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.hoten || 'Nhân viên'}</div>
              <div style={s.userRole}>{ROLE_LABEL[user?.role] || 'Nhân viên'}</div>
            </div>
            <div style={s.avatar}>{vietTat}</div>
          </div>
        </header>

        {/* Content */}
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const BLUE = '#0d6efd';

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'inherit',
  },
  sidebar: {
    width: 220,
    background: '#1a2744',
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    height: '100vh',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '16px 16px',
  },
  logoBox: {
    width: 32,
    height: 32,
    background: BLUE,
    borderRadius: 7,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  logoName: {
    fontSize: 15,
    fontWeight: 500,
    color: '#fff',
  },
  divider: {
    height: '0.5px',
    background: 'rgba(255,255,255,0.07)',
    margin: '0 12px 6px',
  },
  roleBadge: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    padding: '0 20px 8px',
  },
  nav: {
    flex: 1,
    padding: '4px 0',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 9,
    padding: '9px 12px',
    margin: '1px 8px',
    borderRadius: 7,
    color: '#8a96a8',
    cursor: 'pointer',
    transition: 'all .15s',
    userSelect: 'none',
  },
  navActive: {
    background: 'rgba(13,110,253,0.18)',
    color: '#60a5fa',
  },
  navLabel: {
    fontSize: 13,
  },
  sidebarFooter: {
    borderTop: '0.5px solid rgba(255,255,255,0.07)',
    padding: '8px 0',
  },
  main: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#f3f4f6',
    minHeight: '100vh',
    minWidth: 0,
  },
  header: {
    background: '#fff',
    borderBottom: '0.5px solid #e5e7eb',
    padding: '0 24px',
    height: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  breadcrumb: {
    fontSize: 14,
    fontWeight: 500,
    color: '#111827',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    textAlign: 'right',
  },
  userName: {
    fontSize: 13,
    fontWeight: 500,
    color: '#111827',
  },
  userRole: {
    fontSize: 11,
    color: '#6b7280',
  },
  avatar: {
    width: 32,
    height: 32,
    background: BLUE,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 40,
  },
  hamburger: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#111827',
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
    flexShrink: 0,
  },
};
