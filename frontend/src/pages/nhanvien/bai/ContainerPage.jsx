import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import { useContainerBaiList } from '@/hooks/nhanvien/useContainerBai';

/* ── helpers ── */
const trangThaiBadge = (v, row) => {
  const map = {
    dangky:        { label: 'Đăng ký',    variant: 'info' },
    trongbai:      { label: 'Trong bãi',  variant: 'success' },
    // Container xuất rời bãi qua cổng thì gọi là "Xuất cảng" — "Xuất cổng" chỉ dùng
    // cho container nhập được tài xế kéo ra sau khi nhân viên cổng xác nhận.
    xuatcong:      { label: row?.loai_hinh === 'xuat' ? 'Xuất cảng' : 'Xuất cổng', variant: 'warning' },
    dalenken:      { label: 'Xuất cảng',  variant: 'warning' },
    khonghoatdong: { label: 'Vô hiệu',    variant: 'danger' },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const haiquanBadge = (v) => {
  const map = {
    luong_xanh: { label: 'Luồng xanh', variant: 'success' },
    luong_vang: { label: 'Luồng vàng', variant: 'warning' },
    luong_do:   { label: 'Luồng đỏ',   variant: 'danger'  },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

export default function ContainerBaiPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('trongbai');

  const { data, isLoading } = useContainerBaiList({ trang, search, trangthai: filterTT });

  const columns = [
    {
      key: 'socontainer',
      label: 'Số container',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.kichthuoc}ft · {row.loaihang}</div>
        </div>
      ),
    },
    {
      key: 'hangtau',
      label: 'Hãng tàu',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{row.mascac}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tenhangtau}</div>
        </div>
      ),
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v, row) => trangThaiBadge(v, row),
    },
    {
      key: 'trangthai_haiquan',
      label: 'Hải quan',
      align: 'center',
      render: (v) => v ? haiquanBadge(v) : <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      key: 'bi_hong',
      label: 'Tình trạng',
      align: 'center',
      render: (v) => v
        ? <Badge variant="danger">Hư hỏng</Badge>
        : <Badge variant="success">Bình thường</Badge>,
    },
    {
      key: 'thoigian_vaobai',
      label: 'Vào bãi',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Container"
        subtitle="Tra cứu thông tin container trong bãi"
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
            <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}>
              Xóa lọc
            </Button>
          )}
        </form>
        <select
          value={filterTT}
          onChange={e => { setFilterTT(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="trongbai">Trong bãi</option>
          <option value="dangky">Đăng ký</option>
          <option value="xuatcong">Xuất cổng</option>
          <option value="dalenken">Xuất cảng</option>
          <option value="">Tất cả</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Không có container nào" />
      <Pagination
        meta={meta}
        onChange={setTrang}
      />
    </div>
  );
}
