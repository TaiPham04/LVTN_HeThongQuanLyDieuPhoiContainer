import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

const MENU = [
  { path: '/admin/dashboard',      icon: 'ti-layout-dashboard', label: 'Dashboard' },
  { path: '/admin/loai-container', icon: 'ti-box',              label: 'Loại container' },
  { path: '/admin/hang-tau',       icon: 'ti-ship',             label: 'Hãng tàu' },
  { path: '/admin/lich-tau',       icon: 'ti-calendar-event',   label: 'Lịch tàu' },
  { path: '/admin/khu-vuc-bai',    icon: 'ti-map-pin',          label: 'Khu vực bãi' },
  { path: '/admin/container',      icon: 'ti-package',          label: 'Container' },
  { path: '/admin/cong',           icon: 'ti-door-enter',       label: 'Xuất nhập cổng' },
  { path: '/admin/bien-ban-kt',   icon: 'ti-clipboard-check',  label: 'Biên bản KT' },
  { path: '/admin/so-do-bai',      icon: 'ti-layout-grid',      label: 'Sơ đồ bãi' },
  { path: '/admin/tai-khoan',      icon: 'ti-users',            label: 'Tài khoản' },
  { path: '/admin/bao-cao',        icon: 'ti-chart-bar',        label: 'Báo cáo' },
];

export default function AdminLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menu = MENU;

  const vietTat = user?.hoten
    ? user.hoten.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'AD';

  const tenTrang = MENU.find(m => location.pathname.startsWith(m.path))?.label || 'Dashboard';

  return (
    <div style={s.root}>
      {/* ─── SIDEBAR ─── */}
      <aside style={s.sidebar}>
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

        {/* Menu */}
        <nav style={s.nav}>
          {menu.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
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
          <span style={s.breadcrumb}>{tenTrang}</span>
          <div style={s.headerRight}>
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.hoten || 'Admin'}</div>
              <div style={s.userRole}>
                Quản trị viên
              </div>
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

const OR = '#e8920a';

const s = {
  root: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: 'inherit',
  },
  sidebar: {
    width: 220,
    background: '#1c2231',
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
    background: OR,
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
    margin: '0 12px 8px',
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
    background: 'rgba(232,146,10,0.15)',
    color: OR,
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
    background: OR,
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
};