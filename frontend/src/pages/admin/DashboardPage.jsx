import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/ui/Badge';
import { useDashboard } from '@/hooks/admin/useDashboard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

const PIE_COLORS = {
  dangky:   '#f59e0b',
  trongbai: '#3b82f6',
  xuatcong: '#22c55e',
  dalenken: '#8b5cf6',
};

function Card({ title, children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: 12,
      padding: '20px',
    }}>
      {title && (
        <div style={{ fontSize: 14, fontWeight: 600, color: '#374151', marginBottom: 16 }}>
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Dashboard" subtitle="Tổng quan hệ thống cảng Cát Lái" />
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280', fontSize: 14 }}>
          Đang tải dữ liệu…
        </div>
      </div>
    );
  }

  const {
    bieu_do_7_ngay     = [],
    phan_bo_container  = [],
    lap_day_khu_vuc    = [],
    chuyen_tau_sap_den = [],
  } = data ?? {};

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Tổng quan trạng thái hệ thống cảng Cát Lái"
      />

      {/* ── Row 1: Biểu đồ ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 14, marginBottom: 14 }}>
        <Card title="Nhập / Xuất bãi — 7 ngày gần nhất">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={bieu_do_7_ngay} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="ngay" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="nhap" name="Nhập bãi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="xuat" name="Xuất bãi" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Phân bố trạng thái container">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart margin={{ top: 20, right: 10, bottom: 0, left: 10 }}>
              <Pie
                data={phan_bo_container}
                dataKey="so_luong"
                nameKey="nhan"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ percent }) => percent > 0 ? `${(percent * 100).toFixed(0)}%` : ''}
                labelLine={false}
              >
                {phan_bo_container.map((entry) => (
                  <Cell key={entry.trangthai} fill={PIE_COLORS[entry.trangthai] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v + ' container', n]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 4: Lấp đầy khu vực + Chuyến sắp đến ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Card title="Tỷ lệ lấp đầy từng khu vực bãi">
          {lap_day_khu_vuc.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Chưa có dữ liệu khu vực
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {lap_day_khu_vuc.map((k) => (
                <div key={k.tenblock}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 5, fontSize: 13,
                  }}>
                    <span style={{ fontWeight: 600, color: '#374151' }}>Block {k.tenblock}</span>
                    <span style={{ color: '#6b7280' }}>
                      {k.dang_dung}/{k.tong_o} ô &mdash; {k.ty_le}%
                    </span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      width: `${k.ty_le}%`,
                      height: '100%',
                      borderRadius: 99,
                      background: k.ty_le >= 90 ? '#ef4444' : k.ty_le >= 70 ? '#f59e0b' : '#22c55e',
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Chuyến tàu sắp đến (dự kiến)">
          {chuyen_tau_sap_den.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              Không có chuyến tàu nào sắp đến
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {chuyen_tau_sap_den.map((c) => (
                <div key={c.sovoyage} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '10px 14px',
                  background: '#f8fafc',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>
                      {c.sovoyage} — {c.tentau}
                    </div>
                    <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{c.mascac}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#374151', fontWeight: 500 }}>
                      {c.thoigiandukien}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Badge variant="info">Đã lên lịch</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
