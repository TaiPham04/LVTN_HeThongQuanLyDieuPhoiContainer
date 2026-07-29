import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { useContainerKHList, useContainerKHDetail } from '@/hooks/khachhang/useContainerKH';

const trangThaiBadge = (v) => {
  const map = {
    dangky:   { label: 'Đăng ký',   variant: 'info' },
    trongbai: { label: 'Trong bãi', variant: 'success' },
    xuatcong: { label: 'Xuất cổng', variant: 'warning' },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const haiquanBadge = (v) => {
  const map = {
    luong_xanh: { label: 'Luồng xanh', variant: 'success' },
    luong_vang: { label: 'Luồng vàng', variant: 'warning' },
    luong_do:   { label: 'Luồng đỏ',   variant: 'danger'  },
    chua_khai:  { label: 'Chưa khai',  variant: 'gray'    },
  };
  const b = map[v] || { label: v || '—', variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const thongQuanBadge = (daThongQuan) =>
  daThongQuan
    ? <Badge variant="success">Đã thông quan</Badge>
    : <Badge variant="gray">Chưa thông quan</Badge>;

const fmtVND = (n) =>
  n !== null && n !== undefined
    ? `$${Number(n).toFixed(2)}`
    : '—';

function ContainerDetailModal({ macontainer, onClose }) {
  const { data, isLoading } = useContainerKHDetail(macontainer);
  const c = data?.data;
  const vitri = data?.vitri_hien_tai;
  const soNgay = data?.so_ngay_luu_bai;
  const phi = data?.phi_uoc_tinh;
  const timeline = data?.timeline ?? [];

  if (isLoading) {
    return <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Đang tải…</div>;
  }
  if (!c) return null;

  return (
    <div style={{ fontSize: 14, lineHeight: 1.8 }}>
      {/* Info chính */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 20 }}>
        {[
          ['Số container', <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{c.socontainer}</span>],
          ['Loại',         c.tenloai || '—'],
          ['Voyage',       c.sovoyage || '—'],
          ['Hãng tàu',     c.mascac || '—'],
          ['Trạng thái',   trangThaiBadge(c.trangthai)],
          ['Hải quan',     haiquanBadge(c.trangthai_haiquan)],
          ['Thông quan',   c.trangthai_haiquan !== 'chua_khai' ? thongQuanBadge(c.da_thong_quan) : '—'],
          ['Vào bãi',      c.thoigian_vaobai || '—'],
          ['Số ngày lưu',  soNgay !== null ? `${soNgay} ngày` : '—'],
          ['Phí ước tính', fmtVND(phi)],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ color: '#111827' }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Vị trí */}
      {vitri && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          <strong>Vị trí hiện tại:</strong> Block {vitri.tenblock} · Khoảng {vitri.khoang} · Hàng {vitri.hang} · Tầng {vitri.tang}
          {vitri.maobai_code && <span style={{ color: '#6b7280' }}> ({vitri.maobai_code})</span>}
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Lịch sử
          </div>
          {timeline.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: 8, alignItems: 'flex-start' }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0d9488', marginTop: 5, flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t.loai}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{t.thoigian}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
      </div>
    </div>
  );
}

export default function ContainerKHPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [detailId, setDetailId]       = useState(null);

  const { data, isLoading } = useContainerKHList({ trang, search, trangthai: filterTT });

  const columns = [
    {
      key: 'socontainer',
      label: 'Số container',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tenloai}</div>
        </div>
      ),
    },
    {
      key: 'voyage',
      label: 'Chuyến tàu',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{row.tentau || '—'}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.sovoyage} · {row.mascac}</div>
        </div>
      ),
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'trangthai_haiquan',
      label: 'Hải quan',
      align: 'center',
      render: (v) => haiquanBadge(v),
    },
    {
      key: 'thoigian_vaobai',
      label: 'Vào bãi',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: 80,
      align: 'center',
      render: (_, row) => (
        <Button size="sm" variant="ghost" onClick={() => setDetailId(row.macontainer)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Container của tôi"
        description="Theo dõi trạng thái tất cả container đã đăng ký"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setTrang(1); }}
          style={{ display: 'flex', gap: 8, flex: 1 }}
        >
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo số container…"
            style={{ flex: 1, maxWidth: 280, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <Button type="submit" variant="secondary">Tìm</Button>
          {search && (
            <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}>Xóa lọc</Button>
          )}
        </form>
        <select
          value={filterTT}
          onChange={e => { setFilterTT(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="dangky">Đăng ký</option>
          <option value="trongbai">Trong bãi</option>
          <option value="xuatcong">Xuất cổng</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Không có container nào" />
      <Pagination meta={meta} onChange={setTrang} />

      <Modal
        open={!!detailId}
        onClose={() => setDetailId(null)}
        title="Chi tiết container"
        width={560}
      >
        {detailId && (
          <ContainerDetailModal macontainer={detailId} onClose={() => setDetailId(null)} />
        )}
      </Modal>
    </div>
  );
}
