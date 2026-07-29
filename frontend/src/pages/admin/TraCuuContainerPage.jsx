import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/ui/Badge';
import api from '@/lib/axios';

const TRANGTHAI = {
  choxacnhan:    { label: 'Chờ xác nhận',  variant: 'info'    },
  dangky:        { label: 'Đăng ký',        variant: 'gray'    },
  trongbai:      { label: 'Trong bãi',      variant: 'success' },
  xuatcong:      { label: 'Xuất cổng',      variant: 'purple'  },
  dalenken:      { label: 'Đã lên tàu',    variant: 'info'    },
  khonghoatdong: { label: 'Vô hiệu hóa',   variant: 'danger'  },
};

const HAIQUAN = {
  chua_khai:  { label: 'Chưa khai',   variant: 'gray'    },
  luong_xanh: { label: 'Luồng xanh', variant: 'success' },
  luong_vang: { label: 'Luồng vàng', variant: 'warning' },
  luong_do:   { label: 'Luồng đỏ',   variant: 'danger'  },
};

const KIEU = {
  bandau:    { label: 'Tiếp nhận vào bãi', icon: 'ti-map-pin',          color: '#2563eb', bg: '#eff6ff' },
  daochuyen: { label: 'Đảo chuyển',         icon: 'ti-arrows-exchange',  color: '#d97706', bg: '#fffbeb' },
  xuatcong:  { label: 'Xuất cổng',          icon: 'ti-door-exit',        color: '#9333ea', bg: '#faf5ff' },
};

export default function TraCuuContainerPage() {
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    const socontainer = input.trim().toUpperCase();
    if (!socontainer) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      const res = await api.get('/admin/container/tra-cuu', { params: { socontainer } });
      setResult(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Không tìm thấy container.');
    } finally {
      setLoading(false);
    }
  };

  const cont    = result?.container;
  const lichSu  = result?.lich_su ?? [];
  const tt      = TRANGTHAI[cont?.trangthai]  ?? { label: cont?.trangthai,         variant: 'gray' };
  const hq      = HAIQUAN[cont?.trangthai_haiquan] ?? { label: cont?.trangthai_haiquan, variant: 'gray' };

  return (
    <div>
      <PageHeader
        title="Tra cứu container"
        subtitle="Nhập số container để xem lịch sử vị trí và trạng thái"
      />

      {/* ── Ô tìm kiếm ── */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, marginBottom: 24, maxWidth: 480 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value.toUpperCase())}
          placeholder="VD: MSCU1234560"
          style={{
            flex: 1, padding: '10px 14px', border: '2px solid #e2e8f0',
            borderRadius: 10, fontSize: 15, fontFamily: 'monospace',
            fontWeight: 600, outline: 'none', letterSpacing: 1,
          }}
          onFocus={e  => (e.target.style.borderColor = '#2563eb')}
          onBlur={e   => (e.target.style.borderColor = '#e2e8f0')}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 20px', background: loading ? '#94a3b8' : '#2563eb',
            color: '#fff', border: 'none', borderRadius: 10, fontSize: 14,
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Đang tìm…' : 'Tra cứu'}
        </button>
      </form>

      {/* ── Lỗi ── */}
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14 }}>
          <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{error}
        </div>
      )}

      {/* ── Kết quả ── */}
      {cont && (
        <>
          {/* Card thông tin container */}
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '18px 20px', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, color: '#0f172a', letterSpacing: 1 }}>
                {cont.socontainer}
              </span>
              <Badge variant={tt.variant}>{tt.label}</Badge>
              {cont.trangthai_haiquan && <Badge variant={hq.variant}>{hq.label}</Badge>}
              {cont.trangthai_haiquan && cont.trangthai_haiquan !== 'chua_khai' && (
                <Badge variant={cont.da_thong_quan ? 'success' : 'gray'}>
                  {cont.da_thong_quan ? 'Đã thông quan' : 'Chưa thông quan'}
                </Badge>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px 20px', fontSize: 13 }}>
              {[
                ['Loại container', cont.tenloai],
                ['Loại hình',      cont.loai_hinh === 'nhap' ? 'Nhập khẩu' : cont.loai_hinh === 'xuat' ? 'Xuất khẩu' : cont.loai_hinh],
                ['Voyage',         cont.sovoyage],
                ['Tên tàu',        cont.tentau],
                ['Hãng tàu',       cont.mascac],
                ['B/L No.',        cont.so_vandon],
                ['Consignee',      cont.ten_consignee],
                ['Vào bãi',        cont.thoigian_vaobai],
                ['Ra bãi',         cont.thoigian_rabai],
              ].filter(([, v]) => v).map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>{k}</span>
                  <div style={{ color: '#1e293b', fontWeight: 500, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline lịch sử vị trí */}
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
            Lịch sử vị trí
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 400, color: '#94a3b8' }}>
              ({lichSu.length} lần di chuyển)
            </span>
          </h3>

          {lichSu.length === 0 ? (
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: 14 }}>
              <i className="ti ti-map-pin-off" style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
              Container chưa được gán vị trí trong bãi.
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              {/* Đường dọc */}
              <div style={{
                position: 'absolute', left: 19, top: 20, bottom: 20,
                width: 2, background: '#e2e8f0', zIndex: 0,
              }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {lichSu.map((row, idx) => {
                  const kieu     = KIEU[row.kieudichchuyen] ?? { label: row.kieudichchuyen, icon: 'ti-point', color: '#64748b', bg: '#f8fafc' };
                  const isLast   = row.la_hien_tai;

                  return (
                    <div key={row.malichsu} style={{ display: 'flex', gap: 14, position: 'relative', paddingBottom: idx < lichSu.length - 1 ? 20 : 0 }}>
                      {/* Dot */}
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: isLast ? '#16a34a' : kieu.bg,
                        border: `2px solid ${isLast ? '#16a34a' : kieu.color}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 1, position: 'relative',
                      }}>
                        <i className={`ti ${isLast ? 'ti-map-pin-filled' : kieu.icon}`}
                           style={{ fontSize: 16, color: isLast ? '#fff' : kieu.color }} />
                      </div>

                      {/* Nội dung */}
                      <div style={{
                        flex: 1, background: isLast ? '#f0fdf4' : '#fff',
                        border: `1px solid ${isLast ? '#86efac' : '#e2e8f0'}`,
                        borderRadius: 10, padding: '12px 16px', marginTop: 0,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: isLast ? '#15803d' : kieu.color }}>
                            {kieu.label}
                          </span>
                          {isLast && (
                            <span style={{ fontSize: 11, background: '#dcfce7', color: '#15803d', border: '1px solid #86efac', borderRadius: 99, padding: '1px 8px', fontWeight: 600 }}>
                              Hiện tại
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 'auto' }}>
                            {row.thoigian_gan}
                            {row.thoigian_roi && ` → ${row.thoigian_roi}`}
                          </span>
                        </div>

                        {/* Vị trí */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          {row.kieudichchuyen === 'daochuyen' && row.tu_obai && (
                            <>
                              <span style={{ fontFamily: 'monospace', fontSize: 14, color: '#94a3b8', textDecoration: 'line-through' }}>
                                {row.tu_obai}
                              </span>
                              <i className="ti ti-arrow-right" style={{ color: '#94a3b8', fontSize: 13 }} />
                            </>
                          )}
                          <span style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
                            {row.den_obai}
                          </span>
                          <span style={{ fontSize: 12, color: '#64748b' }}>
                            Block <strong>{row.tenblock}</strong>
                            &nbsp;·&nbsp;Khoang {row.khoang} · Hàng {row.hang} · Tầng {row.tang}
                          </span>
                        </div>

                        {/* Nhân viên */}
                        {row.hoten_nv && (
                          <div style={{ marginTop: 5, fontSize: 12, color: '#94a3b8' }}>
                            <i className="ti ti-user" style={{ marginRight: 4 }} />
                            {row.hoten_nv}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
