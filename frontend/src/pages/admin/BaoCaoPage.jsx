import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { useBaoCaoXuatNhap, useBaoCaoContainer, useBaoCaoHangTau } from '@/hooks/useBaoCao';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

/* ── Ngày mặc định: 30 ngày gần nhất ── */
const today = new Date().toISOString().slice(0, 10);
const ago30 = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);

/* ── Badge helpers ── */
const kieuBadge = (v) => v === 'nhap'
  ? <Badge variant="success">Nhập bãi</Badge>
  : <Badge variant="warning">Xuất bãi</Badge>;

const trangThaiBadge = (v) => {
  const map = {
    dangky:   ['info',    'Chờ vào bãi'],
    trongbai: ['info',    'Trong bãi'],
    xuatcong: ['success', 'Đã xuất cổng'],
  };
  const [variant, label] = map[v] ?? ['gray', v];
  return <Badge variant={variant}>{label}</Badge>;
};

const haiQuanBadge = (v) => {
  const map = {
    dathongguan: ['success', 'Thông quan'],
    dangxuly:    ['info',    'Đang xử lý'],
    choxuly:     ['gray',    'Chờ xử lý'],
    tuchoi:      ['danger',  'Từ chối'],
  };
  const [variant, label] = map[v] ?? ['gray', v];
  return <Badge variant={variant}>{label}</Badge>;
};

/* ── SumBox ── */
function SumBox({ label, value, color }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '12px 20px', borderLeft: `3px solid ${color}`, minWidth: 130,
    }}>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{value ?? 0}</div>
    </div>
  );
}

/* ── FilterRow ── */
function FilterRow({ tu, den, onTu, onDen, onLoc, loading, extra }) {
  const inputStyle = {
    padding: '8px 10px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
  };
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-end',
      flexWrap: 'wrap', marginBottom: 16,
      background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Từ ngày</label>
        <input type="date" value={tu} onChange={e => onTu(e.target.value)} style={inputStyle} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Đến ngày</label>
        <input type="date" value={den} onChange={e => onDen(e.target.value)} style={inputStyle} />
      </div>
      {extra}
      <button
        onClick={onLoc}
        disabled={loading}
        style={{
          padding: '8px 20px', background: '#2563eb', color: '#fff',
          border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
          cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? 'Đang tải…' : 'Lọc'}
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function BaoCaoPage() {
  const [tab, setTab] = useState('xuat-nhap');

  const selectStyle = {
    padding: '8px 10px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none',
  };

  /* ── Tab 1: Xuất nhập ── */
  const [xnTu, setXnTu]     = useState(ago30);
  const [xnDen, setXnDen]   = useState(today);
  const [xnKieu, setXnKieu] = useState('');
  const [xnParams, setXnParams] = useState({ tu: ago30, den: today, kieu: '' });
  const [xnPage, setXnPage] = useState(1);
  const xnQuery = useBaoCaoXuatNhap({ ...xnParams, page: xnPage });

  /* ── Tab 2: Container ── */
  const [ctTu, setCtTu]         = useState(ago30);
  const [ctDen, setCtDen]       = useState(today);
  const [ctTT, setCtTT]         = useState('');
  const [ctParams, setCtParams] = useState({ tu: ago30, den: today, trangthai: '' });
  const [ctPage, setCtPage]     = useState(1);
  const ctQuery = useBaoCaoContainer({ ...ctParams, page: ctPage });

  /* ── Tab 3: Hãng tàu ── */
  const [htTu, setHtTu]         = useState(ago30);
  const [htDen, setHtDen]       = useState(today);
  const [htParams, setHtParams] = useState({ tu: ago30, den: today });
  const htQuery = useBaoCaoHangTau(htParams);

  /* ── Handlers ── */
  const locXuatNhap  = () => { setXnPage(1); setXnParams({ tu: xnTu, den: xnDen, kieu: xnKieu }); };
  const locContainer = () => { setCtPage(1); setCtParams({ tu: ctTu, den: ctDen, trangthai: ctTT }); };
  const locHangTau   = () => { setHtParams({ tu: htTu, den: htDen }); };

  /* ── Columns ── */
  const colsXN = [
    { key: 'thoigian_xl',    label: 'Thời gian',    width: 130 },
    { key: 'socontainer',    label: 'Số container',  width: 135 },
    { key: 'mascac',         label: 'Hãng tàu',      width: 80  },
    { key: 'sovoyage',       label: 'Voyage',         width: 90  },
    { key: 'kieu_xuatnhap',  label: 'Kiểu',           width: 110, render: (v) => kieuBadge(v) },
    { key: 'biensoxe',       label: 'Biển số xe',     width: 115 },
    { key: 'hoten_nhanvien', label: 'Nhân viên XL',   width: 150 },
  ];

  const colsCT = [
    { key: 'socontainer',       label: 'Số container', width: 135 },
    { key: 'tenloai',           label: 'Loại',          width: 100 },
    { key: 'mascac',            label: 'Hãng tàu',      width: 80  },
    { key: 'sovoyage',          label: 'Voyage',         width: 90  },
    { key: 'trangthai',         label: 'Trạng thái',     width: 130, render: (v) => trangThaiBadge(v) },
    { key: 'trangthai_haiquan', label: 'Hải quan',       width: 130, render: (v) => haiQuanBadge(v)   },
    { key: 'thoigian_vaobai',   label: 'Vào bãi',        width: 130 },
    { key: 'thoigian_rabai',    label: 'Ra bãi',          width: 130 },
  ];

  const colsHT = [
    { key: 'mascac',     label: 'Mã SCAC',      width: 90  },
    { key: 'tenhangtau', label: 'Tên hãng tàu', width: 200 },
    { key: 'tong',       label: 'Tổng',          width: 70, align: 'center' },
    { key: 'trong_bai',  label: 'Trong bãi',     width: 90, align: 'center' },
    { key: 'xuat_cong',  label: 'Đã xuất cổng',  width: 110, align: 'center' },
    {
      key: 'bi_hong', label: 'Bị hỏng', width: 90, align: 'center',
      render: (v) => v > 0
        ? <Badge variant="danger">{v}</Badge>
        : <span style={{ color: '#9ca3af' }}>0</span>,
    },
  ];

  /* ─────────── RENDER ─────────── */
  return (
    <div>
      <PageHeader
        title="Báo cáo"
        description="Thống kê và tra cứu dữ liệu theo khoảng thời gian"
      />

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0', marginBottom: 20 }}>
        {[
          { key: 'xuat-nhap', label: 'Nhật ký xuất nhập' },
          { key: 'container', label: 'Tổng hợp container' },
          { key: 'hang-tau',  label: 'Thống kê hãng tàu'  },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '9px 22px', fontSize: 13, fontWeight: 600,
            border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0',
            background: tab === t.key ? '#2563eb' : '#f1f5f9',
            color: tab === t.key ? '#fff' : '#374151',
            borderBottom: tab === t.key ? '2px solid #2563eb' : '2px solid transparent',
            marginBottom: -2,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ════ TAB 1: NHẬT KÝ XUẤT NHẬP ════ */}
      {tab === 'xuat-nhap' && (
        <div>
          <FilterRow
            tu={xnTu} den={xnDen} onTu={setXnTu} onDen={setXnDen}
            onLoc={locXuatNhap} loading={xnQuery.isLoading}
            extra={
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Kiểu</label>
                <select value={xnKieu} onChange={e => setXnKieu(e.target.value)} style={selectStyle}>
                  <option value="">Tất cả</option>
                  <option value="nhap">Nhập bãi</option>
                  <option value="xuat">Xuất bãi</option>
                </select>
              </div>
            }
          />

          {xnQuery.data && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <SumBox label="Tổng nhập bãi" value={xnQuery.data.tom_tat.tong_nhap} color="#22c55e" />
                <SumBox label="Tổng xuất bãi" value={xnQuery.data.tom_tat.tong_xuat} color="#f59e0b" />
              </div>
              <Table
                columns={colsXN}
                data={xnQuery.data.data ?? []}
                loading={xnQuery.isLoading}
                emptyText="Không có bản ghi nào trong khoảng thời gian này"
              />
              <Pagination meta={xnQuery.data.meta} onChange={p => setXnPage(p)} />
            </>
          )}
        </div>
      )}

      {/* ════ TAB 2: TỔNG HỢP CONTAINER ════ */}
      {tab === 'container' && (
        <div>
          <FilterRow
            tu={ctTu} den={ctDen} onTu={setCtTu} onDen={setCtDen}
            onLoc={locContainer} loading={ctQuery.isLoading}
            extra={
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Trạng thái</label>
                <select value={ctTT} onChange={e => setCtTT(e.target.value)} style={selectStyle}>
                  <option value="">Tất cả</option>
                  <option value="dangky">Chờ vào bãi</option>
                  <option value="trongbai">Trong bãi</option>
                  <option value="xuatcong">Đã xuất cổng</option>
                </select>
              </div>
            }
          />

          {ctQuery.data && (
            <>
              <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                <SumBox label="Chờ vào bãi"  value={ctQuery.data.tom_tat.tong_dangky}   color="#f59e0b" />
                <SumBox label="Trong bãi"    value={ctQuery.data.tom_tat.tong_trongbai}  color="#3b82f6" />
                <SumBox label="Đã xuất cổng" value={ctQuery.data.tom_tat.tong_xuatcong}  color="#22c55e" />
                <SumBox label="Bị hỏng"      value={ctQuery.data.tom_tat.tong_bi_hong}   color="#ef4444" />
              </div>
              <Table
                columns={colsCT}
                data={ctQuery.data.data ?? []}
                loading={ctQuery.isLoading}
                emptyText="Không có container nào trong khoảng thời gian này"
              />
              <Pagination meta={ctQuery.data.meta} onChange={p => setCtPage(p)} />
            </>
          )}
        </div>
      )}

      {/* ════ TAB 3: THỐNG KÊ HÃNG TÀU ════ */}
      {tab === 'hang-tau' && (
        <div>
          <FilterRow
            tu={htTu} den={htDen} onTu={setHtTu} onDen={setHtDen}
            onLoc={locHangTau} loading={htQuery.isLoading}
          />

          {htQuery.data && (() => {
            const rows = htQuery.data.data ?? [];
            return (
              <>
                {rows.length > 0 && (
                  <div style={{
                    background: '#fff', border: '1px solid #e2e8f0',
                    borderRadius: 12, padding: 20, marginBottom: 16,
                  }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
                      Số container theo hãng tàu
                    </div>
                    <ResponsiveContainer width="100%" height={Math.max(200, rows.length * 44)}>
                      <BarChart layout="vertical" data={rows} margin={{ left: 10, right: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                        <YAxis dataKey="mascac" type="category" width={65} tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey="tong"      name="Tổng"      fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="trong_bai" name="Trong bãi" fill="#22c55e" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="xuat_cong" name="Đã xuất"   fill="#f59e0b" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <Table
                  columns={colsHT}
                  data={rows}
                  loading={htQuery.isLoading}
                  emptyText="Không có dữ liệu trong khoảng thời gian này"
                />
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
