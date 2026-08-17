import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/ui/Badge';
import { useDashboardKH } from '@/hooks/khachhang/useDashboardKH';
import { useNavigate } from 'react-router-dom';

const trangThaiBadge = (v) => {
  const map = {
    cho_lay:  { label: 'Chờ lấy',  variant: 'warning' },
    da_lay:   { label: 'Đã lấy',   variant: 'success' },
    huy:      { label: 'Đã hủy',   variant: 'danger'  },
    het_han:  { label: 'Hết hạn',  variant: 'gray'    },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const chuyenTauBadge = (v) => {
  if (v === 'dadencang') return <Badge variant="warning">Đã đến cảng</Badge>;
  return <Badge variant="info">Đã lên lịch</Badge>;
};

const fmtVND = (n) =>
  n ? `$${Number(n).toFixed(2)}` : '$0.00';

export default function DashboardKHPage() {
  const { data, isLoading } = useDashboardKH();
  const navigate = useNavigate();

  const the     = data?.the_so ?? {};
  const trongBai = data?.container_trong_bai ?? [];
  const sapDen  = data?.chuyen_sap_den ?? [];
  const phieu   = data?.phieu_gan_nhat ?? [];
  const sapQua  = data?.canh_bao_freetime?.sap_qua ?? [];
  const daQua   = data?.canh_bao_freetime?.da_qua  ?? [];

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Tổng quan" subtitle="Theo dõi container và hoạt động của bạn" />
        <div style={{ color: '#9ca3af', padding: 40, textAlign: 'center' }}>Đang tải…</div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tổng quan" subtitle="Theo dõi container và hoạt động của bạn" />

      {/* ── Cảnh báo Free Time (hiển thị nổi bật nếu có) ── */}
      {(daQua.length > 0 || sapQua.length > 0) && (
        <div style={{ display: 'grid', gridTemplateColumns: daQua.length && sapQua.length ? '1fr 1fr' : '1fr', gap: 16, marginBottom: 20 }}>

          {/* Đã quá free time */}
          {daQua.length > 0 && (
            <div style={{ ...s.alertBox, borderColor: '#fca5a5', background: '#fff5f5' }}>
              <div style={s.alertHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ ...s.alertDot, background: '#ef4444' }} />
                  <span style={{ ...s.alertTitle, color: '#dc2626' }}>
                    Đã quá free time ({daQua.length} container)
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#ef4444', fontWeight: 500 }}>Đang phát sinh phí lưu bãi</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                <thead>
                  <tr>
                    {['Container', 'Loại', 'Số ngày', 'Ngày quá', 'Phí ước tính'].map(h => (
                      <th key={h} style={{ ...s.th, color: '#dc2626', borderBottomColor: '#fecaca' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {daQua.map(c => (
                    <tr key={c.macontainer}>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 700, color: '#dc2626' }}>
                        {c.socontainer}
                      </td>
                      <td style={{ ...s.td, fontSize: 12 }}>{c.tenloai || '—'}</td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: 600, color: '#dc2626' }}>
                        {c.so_ngay}
                      </td>
                      <td style={{ ...s.td, textAlign: 'center', color: '#ef4444', fontWeight: 600 }}>
                        +{c.ngay_tinh_phi} ngày
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', color: '#dc2626', fontWeight: 600 }}>
                        {fmtVND(c.phi_uoc_tinh)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Sắp quá free time */}
          {sapQua.length > 0 && (
            <div style={{ ...s.alertBox, borderColor: '#fde68a', background: '#fffbeb' }}>
              <div style={s.alertHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ ...s.alertDot, background: '#f59e0b' }} />
                  <span style={{ ...s.alertTitle, color: '#92400e' }}>
                    Sắp quá free time ({sapQua.length} container)
                  </span>
                </div>
                <span style={{ fontSize: 11, color: '#d97706', fontWeight: 500 }}>Hãy lấy hàng sớm</span>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
                <thead>
                  <tr>
                    {['Container', 'Loại', 'Số ngày', 'Còn lại', 'Đơn giá/ngày'].map(h => (
                      <th key={h} style={{ ...s.th, color: '#92400e', borderBottomColor: '#fde68a' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sapQua.map(c => (
                    <tr key={c.macontainer}>
                      <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 700, color: '#92400e' }}>
                        {c.socontainer}
                      </td>
                      <td style={{ ...s.td, fontSize: 12 }}>{c.tenloai || '—'}</td>
                      <td style={{ ...s.td, textAlign: 'center', fontWeight: 600 }}>{c.so_ngay}</td>
                      <td style={{ ...s.td, textAlign: 'center' }}>
                        <span style={{
                          background: c.con_lai === 0 ? '#fee2e2' : '#fef3c7',
                          color: c.con_lai === 0 ? '#dc2626' : '#d97706',
                          fontWeight: 700, fontSize: 12,
                          padding: '2px 8px', borderRadius: 99,
                        }}>
                          {c.con_lai === 0 ? 'Hôm nay!' : `${c.con_lai} ngày`}
                        </span>
                      </td>
                      <td style={{ ...s.td, textAlign: 'right', color: '#92400e', fontWeight: 600 }}>
                        {fmtVND(c.don_gia)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Thẻ thống kê ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Tổng container', value: the.tong_container ?? 0, color: '#0d9488', icon: 'ti-package' },
          { label: 'Đăng ký',        value: the.dang_ky ?? 0,        color: '#3b82f6', icon: 'ti-clock' },
          { label: 'Trong bãi',      value: the.trong_bai ?? 0,      color: '#10b981', icon: 'ti-building-warehouse' },
          { label: 'Xuất cổng',      value: the.xuat_cong ?? 0,      color: '#6b7280', icon: 'ti-circle-check' },
          { label: 'Phiếu chờ lấy',  value: the.phieu_cho_xuly ?? 0, color: '#f59e0b', icon: 'ti-ticket' },
        ].map(({ label, value, color, icon }) => (
          <div key={label} style={s.card}>
            <div style={{ ...s.cardIcon, background: color + '1a', color }}>
              <i className={`ti ${icon}`} style={{ fontSize: 20 }} />
            </div>
            <div style={s.cardVal}>{value}</div>
            <div style={s.cardLabel}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Row 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Container trong bãi */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>Container đang trong bãi</span>
            <span style={s.seeAll} onClick={() => navigate('/kh/containers')}>Xem tất cả →</span>
          </div>
          {trongBai.length === 0 ? (
            <div style={s.empty}>Không có container trong bãi</div>
          ) : trongBai.map((c) => (
            <div key={c.macontainer} style={s.listRow}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{c.socontainer}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{c.tenloai} · Voyage {c.sovoyage || '—'}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: c.so_ngay > 5 ? '#ef4444' : '#374151' }}>
                  {c.so_ngay ?? 0} ngày
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{c.thoigian_vaobai || '—'}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Chuyến sắp đến */}
        <div style={s.section}>
          <div style={s.sectionHeader}>
            <span style={s.sectionTitle}>Chuyến tàu sắp đến</span>
            <span style={s.seeAll} onClick={() => navigate('/kh/booking')}>Xem tất cả →</span>
          </div>
          {sapDen.length === 0 ? (
            <div style={s.empty}>Không có chuyến tàu nào</div>
          ) : sapDen.map((ct) => (
            <div key={ct.machuyentau} style={s.listRow}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{ct.tentau}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>
                  {ct.mascac} · {ct.sovoyage} · {ct.thoigiandukien || '—'}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {chuyenTauBadge(ct.trangthai)}
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{ct.so_cont_dangky} cont</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Phiếu lấy hàng gần nhất ── */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Phiếu lấy hàng gần nhất</span>
          <span style={s.seeAll} onClick={() => navigate('/kh/phieu-lay-hang')}>Xem tất cả →</span>
        </div>
        {phieu.length === 0 ? (
          <div style={s.empty}>Chưa có phiếu lấy hàng nào</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Số container', 'Biển số xe', 'Tài xế', 'Trạng thái', 'Thời gian'].map(h => (
                  <th key={h} style={s.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {phieu.map((p) => (
                <tr key={p.maphieu} style={s.tr}>
                  <td style={{ ...s.td, fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>
                    {p.socontainer || '—'}
                  </td>
                  <td style={s.td}>{p.biensoxe || '—'}</td>
                  <td style={s.td}>{p.hoten_taixe || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'center' }}>{trangThaiBadge(p.trangthai)}</td>
                  <td style={{ ...s.td, fontSize: 12, color: '#6b7280' }}>{p.thoigian_xuat || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const s = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: '20px 16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  cardVal: {
    fontSize: 26,
    fontWeight: 700,
    color: '#111827',
    lineHeight: 1,
  },
  cardLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  section: {
    background: '#fff',
    borderRadius: 12,
    padding: 20,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  alertBox: {
    borderRadius: 12,
    padding: '16px 20px',
    border: '1px solid',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  },
  alertHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: '50%',
    flexShrink: 0,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: 600,
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
  },
  seeAll: {
    fontSize: 12,
    color: '#0d9488',
    cursor: 'pointer',
  },
  listRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  empty: {
    color: '#9ca3af',
    fontSize: 13,
    padding: '12px 0',
    textAlign: 'center',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    color: '#6b7280',
    borderBottom: '1px solid #f3f4f6',
  },
  tr: {
    borderBottom: '1px solid #f9fafb',
  },
  td: {
    padding: '10px 12px',
    fontSize: 13,
    color: '#374151',
  },
};
