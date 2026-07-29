import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/authStore';

const MENU = [
  { path: '/driver/phieu-lay-hang', icon: 'ti-ticket',  label: 'Phiếu lấy hàng' },
];

export default function TaiXeLayout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const vietTat = user?.hoten
    ? user.hoten.split(' ').map(w => w[0]).slice(-2).join('').toUpperCase()
    : 'TX';

  const tenTrang = MENU.find(m => location.pathname.startsWith(m.path))?.label || 'Tài xế';

  return (
    <div style={s.root}>
      {/* ─── SIDEBAR ─── */}
      <aside style={s.sidebar}>
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
        <div style={s.roleBadge}>Tài xế</div>

        <nav style={s.nav}>
          {MENU.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div key={item.path} onClick={() => navigate(item.path)}
                style={{ ...s.navItem, ...(isActive ? s.navActive : {}) }}>
                <i className={`ti ${item.icon}`} style={{ fontSize: 17, flexShrink: 0 }} />
                <span style={s.navLabel}>{item.label}</span>
              </div>
            );
          })}
        </nav>

        <div style={s.sidebarFooter}>
          <div onClick={handleLogout} style={s.navItem}>
            <i className="ti ti-logout" style={{ fontSize: 17 }} />
            <span style={s.navLabel}>Đăng xuất</span>
          </div>
        </div>
      </aside>

      {/* ─── MAIN ─── */}
      <div style={s.main}>
        <header style={s.header}>
          <span style={s.breadcrumb}>{tenTrang}</span>
          <div
            style={{ ...s.headerRight, cursor: 'pointer' }}
            onClick={() => navigate('/driver/profile')}
            title="Thông tin cá nhân"
          >
            <div style={s.userInfo}>
              <div style={s.userName}>{user?.hoten || 'Tài xế'}</div>
              <div style={s.userRole}>Tài xế</div>
            </div>
            <div style={s.avatar}>{vietTat}</div>
          </div>
        </header>
        <main style={s.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}

const TEAL = '#0d9488';

const s = {
  root:         { display: 'flex', minHeight: '100vh', fontFamily: 'inherit' },
  sidebar:      { width: 220, background: '#134e4a', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' },
  logo:         { display: 'flex', alignItems: 'center', gap: 8, padding: '16px 16px' },
  logoBox:      { width: 32, height: 32, background: TEAL, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  logoName:     { fontSize: 15, fontWeight: 500, color: '#fff' },
  divider:      { height: '0.5px', background: 'rgba(255,255,255,0.07)', margin: '0 12px 6px' },
  roleBadge:    { fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 20px 8px' },
  nav:          { flex: 1, padding: '4px 0', overflowY: 'auto' },
  navItem:      { display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', margin: '1px 8px', borderRadius: 7, color: '#8a96a8', cursor: 'pointer', transition: 'all .15s', userSelect: 'none' },
  navActive:    { background: 'rgba(13,148,136,0.25)', color: '#5eead4' },
  navLabel:     { fontSize: 13 },
  sidebarFooter:{ borderTop: '0.5px solid rgba(255,255,255,0.07)', padding: '8px 0' },
  main:         { flex: 1, display: 'flex', flexDirection: 'column', background: '#f3f4f6', minHeight: '100vh' },
  header:       { background: '#fff', borderBottom: '0.5px solid #e5e7eb', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 10 },
  breadcrumb:   { fontSize: 14, fontWeight: 500, color: '#111827' },
  headerRight:  { display: 'flex', alignItems: 'center', gap: 12 },
  userInfo:     { textAlign: 'right' },
  userName:     { fontSize: 13, fontWeight: 500, color: '#111827' },
  userRole:     { fontSize: 11, color: '#6b7280' },
  avatar:       { width: 32, height: 32, background: TEAL, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, color: '#fff', flexShrink: 0 },
  content:      { flex: 1, padding: 24 },
};
