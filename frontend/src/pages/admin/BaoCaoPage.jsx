import { useState, useMemo } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import FilterableTable from '@/components/ui/FilterableTable';
import Badge from '@/components/ui/Badge';
import { useBaoCaoXuatNhap, useBaoCaoContainer, useBaoCaoHangTau } from '@/hooks/useBaoCao';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';

const today = new Date().toISOString().slice(0, 10);
const ago30 = new Date(Date.now() - 29 * 86400_000).toISOString().slice(0, 10);

const COLORS = ['#3b82f6','#22c55e','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#ec4899','#14b8a6'];

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
    luong_xanh: ['success', 'Luồng xanh'],
    luong_vang: ['warning', 'Luồng vàng'],
    luong_do:   ['danger',  'Luồng đỏ'],
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
  const inp = { padding: '8px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff' };
  return (
    <div style={{
      display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap',
      marginBottom: 16, background: '#f8fafc', border: '1px solid #e2e8f0',
      borderRadius: 10, padding: '14px 16px',
    }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Từ ngày</label>
        <input type="date" value={tu} onChange={e => onTu(e.target.value)} style={inp} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Đến ngày</label>
        <input type="date" value={den} onChange={e => onDen(e.target.value)} style={inp} />
      </div>
      {extra}
      <button
        onClick={onLoc} disabled={loading}
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

/* ── Chart type switcher ── */
function ChartTypeSwitcher({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[{ k: 'bar', l: 'Cột' }, { k: 'line', l: 'Đường' }, { k: 'pie', l: 'Tròn' }].map(({ k, l }) => (
        <button
          key={k} onClick={() => onChange(k)}
          style={{
            padding: '4px 14px', fontSize: 12, border: '1px solid #e2e8f0',
            borderRadius: 6, cursor: 'pointer',
            background: value === k ? '#2563eb' : '#fff',
            color:      value === k ? '#fff'    : '#374151',
            fontWeight: value === k ? 600 : 400,
          }}
        >{l}</button>
      ))}
    </div>
  );
}

/* ── Generic chart renderer ── */
function ChartView({ type, chartData = [], pieData = [], series = [], labelKey = 'name', height = 260 }) {
  const empty = (
    <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 13 }}>
      Không có dữ liệu
    </div>
  );

  if (type === 'pie') {
    const valid = pieData.filter(d => d.value > 0);
    if (!valid.length) return empty;
    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={valid} dataKey="value" nameKey="name"
            cx="50%" cy="50%" outerRadius={95}
            label={valid.length <= 5 ? ({ percent }) => `${(percent * 100).toFixed(0)}%` : false}
          >
            {valid.map((e, i) => <Cell key={i} fill={e.color ?? COLORS[i % COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(v, name) => [v, name]} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (!chartData.length) return empty;

  const commonProps = {
    data: chartData,
    margin: { left: 0, right: 20, top: 5 },
  };
  const axisProps = {
    xAxis: <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} />,
    yAxis: <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />,
    grid:  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />,
  };

  if (type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart {...commonProps}>
          {axisProps.grid}{axisProps.xAxis}{axisProps.yAxis}
          <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
          {series.map(s => (
            <Line key={s.key} type="monotone" dataKey={s.key} name={s.name}
              stroke={s.color} strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart {...commonProps}>
        {axisProps.grid}{axisProps.xAxis}{axisProps.yAxis}
        <Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
        {series.map(s => (
          <Bar key={s.key} dataKey={s.key} name={s.name} fill={s.color} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Chart card wrapper ── */
function ChartCard({ title, type, onTypeChange, children }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0',
      borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{title}</span>
        <ChartTypeSwitcher value={type} onChange={onTypeChange} />
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function BaoCaoPage() {
  const [tab, setTab] = useState('xuat-nhap');
  const [xnChart, setXnChart] = useState('line');
  const [ctChart, setCtChart] = useState('pie');
  const [htChart, setHtChart] = useState('bar');

  const selectStyle = {
    padding: '8px 10px', border: '1px solid #e2e8f0',
    borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none',
  };

  /* ── Tab 1 ── */
  const [xnTu, setXnTu]       = useState(ago30);
  const [xnDen, setXnDen]     = useState(today);
  const [xnKieu, setXnKieu]   = useState('');
  const [xnParams, setXnParams] = useState({ tu: ago30, den: today, kieu: '' });
  const xnQuery = useBaoCaoXuatNhap({ ...xnParams, per_page: 9999 });

  /* ── Tab 2 ── */
  const [ctTu, setCtTu]         = useState(ago30);
  const [ctDen, setCtDen]       = useState(today);
  const [ctTT, setCtTT]         = useState('');
  const [ctParams, setCtParams] = useState({ tu: ago30, den: today, trangthai: '' });
  const ctQuery = useBaoCaoContainer({ ...ctParams, per_page: 9999 });

  /* ── Tab 3 ── */
  const [htTu, setHtTu]         = useState(ago30);
  const [htDen, setHtDen]       = useState(today);
  const [htParams, setHtParams] = useState({ tu: ago30, den: today });
  const htQuery = useBaoCaoHangTau(htParams);

  const locXuatNhap  = () => setXnParams({ tu: xnTu, den: xnDen, kieu: xnKieu });
  const locContainer = () => setCtParams({ tu: ctTu, den: ctDen, trangthai: ctTT });
  const locHangTau   = () => setHtParams({ tu: htTu, den: htDen });

  /* ── Chart data: Tab 1 — group log entries by date ── */
  const xnChartData = useMemo(() => {
    if (!xnQuery.data?.data?.length) return [];
    const map = {};
    for (const r of xnQuery.data.data) {
      const raw = (r.thoigian_xl ?? '').toString();
      const key = raw.slice(0, 10);
      const lbl = raw.length >= 10 ? `${raw.slice(8, 10)}/${raw.slice(5, 7)}` : raw;
      if (!map[key]) map[key] = { ngay: lbl, nhap: 0, xuat: 0 };
      if (r.kieu_xuatnhap === 'nhap') map[key].nhap++;
      else map[key].xuat++;
    }
    return Object.values(map).sort((a, b) => a.ngay.localeCompare(b.ngay));
  }, [xnQuery.data]);

  const xnPieData = useMemo(() => [
    { name: 'Nhập bãi', value: xnQuery.data?.tom_tat?.tong_nhap ?? 0, color: '#22c55e' },
    { name: 'Xuất bãi', value: xnQuery.data?.tom_tat?.tong_xuat ?? 0, color: '#f59e0b' },
  ], [xnQuery.data]);

  const xnSeries = [
    { key: 'nhap', name: 'Nhập bãi', color: '#22c55e' },
    { key: 'xuat', name: 'Xuất bãi', color: '#f59e0b' },
  ];

  /* ── Chart data: Tab 2 — status distribution ── */
  const ctChartData = useMemo(() => [
    { name: 'Chờ vào bãi',  so_luong: ctQuery.data?.tom_tat?.tong_dangky   ?? 0 },
    { name: 'Trong bãi',    so_luong: ctQuery.data?.tom_tat?.tong_trongbai  ?? 0 },
    { name: 'Đã xuất cổng', so_luong: ctQuery.data?.tom_tat?.tong_xuatcong  ?? 0 },
    { name: 'Bị hỏng',      so_luong: ctQuery.data?.tom_tat?.tong_bi_hong   ?? 0 },
  ], [ctQuery.data]);

  const ctPieData  = useMemo(() =>
    ctChartData.map((d, i) => ({ name: d.name, value: d.so_luong, color: COLORS[i] })),
    [ctChartData]
  );
  const ctSeries = [{ key: 'so_luong', name: 'Số container', color: '#3b82f6' }];

  /* ── Chart data: Tab 3 ── */
  const htRows    = htQuery.data?.data ?? [];
  const htPieData = htRows.map((r, i) => ({ name: r.mascac, value: r.tong ?? 0, color: COLORS[i % COLORS.length] }));
  const htSeries  = [
    { key: 'tong',      name: 'Tổng',      color: '#3b82f6' },
    { key: 'trong_bai', name: 'Trong bãi', color: '#22c55e' },
    { key: 'xuat_cong', name: 'Đã xuất',   color: '#f59e0b' },
  ];

  /* ── Columns ── */
  const colsXN = [
    { key: 'thoigian_xl',    label: 'Thời gian',     width: 130 },
    { key: 'socontainer',    label: 'Số container',   width: 135 },
    { key: 'mascac',         label: 'Hãng tàu',       width: 80  },
    { key: 'sovoyage',       label: 'Voyage',          width: 90  },
    { key: 'kieu_xuatnhap',  label: 'Kiểu',            width: 110, render: (v) => kieuBadge(v) },
    { key: 'biensoxe',       label: 'Biển số xe',      width: 115 },
    { key: 'hoten_nhanvien', label: 'Nhân viên XL',    width: 150 },
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
    { key: 'tong',       label: 'Tổng',          width: 70,  align: 'center' },
    { key: 'trong_bai',  label: 'Trong bãi',     width: 90,  align: 'center' },
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

      {/* Tabs */}
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

      {/* ════ TAB 1 ════ */}
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
              <ChartCard title="Xu hướng xuất nhập theo ngày" type={xnChart} onTypeChange={setXnChart}>
                <ChartView
                  type={xnChart} labelKey="ngay"
                  chartData={xnChartData} pieData={xnPieData} series={xnSeries}
                />
              </ChartCard>
              <FilterableTable
                columns={colsXN} data={xnQuery.data.data ?? []}
                loading={xnQuery.isLoading}
                emptyText="Không có bản ghi nào trong khoảng thời gian này"
              />
            </>
          )}
        </div>
      )}

      {/* ════ TAB 2 ════ */}
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
              <ChartCard title="Phân bổ trạng thái container" type={ctChart} onTypeChange={setCtChart}>
                <ChartView
                  type={ctChart} labelKey="name"
                  chartData={ctChartData} pieData={ctPieData} series={ctSeries}
                />
              </ChartCard>
              <FilterableTable
                columns={colsCT} data={ctQuery.data.data ?? []}
                loading={ctQuery.isLoading}
                emptyText="Không có container nào trong khoảng thời gian này"
              />
            </>
          )}
        </div>
      )}

      {/* ════ TAB 3 ════ */}
      {tab === 'hang-tau' && (
        <div>
          <FilterRow
            tu={htTu} den={htDen} onTu={setHtTu} onDen={setHtDen}
            onLoc={locHangTau} loading={htQuery.isLoading}
          />
          {htQuery.data && (
            <>
              <ChartCard title="Số container theo hãng tàu" type={htChart} onTypeChange={setHtChart}>
                <ChartView
                  type={htChart} labelKey="mascac"
                  chartData={htRows} pieData={htPieData} series={htSeries}
                  height={Math.max(240, htRows.length * 44)}
                />
              </ChartCard>
              <FilterableTable
                columns={colsHT} data={htRows}
                loading={htQuery.isLoading}
                emptyText="Không có dữ liệu trong khoảng thời gian này"
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}
