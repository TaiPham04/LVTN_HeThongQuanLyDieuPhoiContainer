import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import Toast from '@/components/ui/Toast';
import { useLichTauCongList, useChuyenTrangThaiCong } from '@/hooks/nhanvien/useLichTauCong';

/* ── helpers ── */
const trangThaiBadge = (v) => {
  switch (v) {
    case 'dalenlich': return <Badge variant="info">Đã lên lịch</Badge>;
    case 'dadencang':  return <Badge variant="warning">Đã đến cảng</Badge>;
    case 'daroi':     return <Badge variant="success">Đã rời</Badge>;
    case 'dahuy':     return <Badge variant="danger">Đã hủy</Badge>;
    default:          return <Badge variant="gray">{v}</Badge>;
  }
};

const NEXT_ACTION = {
  dalenlich: { label: 'Ghi nhận đến cảng', variant: 'warning' },
  dadencang:  { label: 'Ghi nhận rời bến',  variant: 'secondary' },
};

export default function LichTauCongPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [confirming, setConfirming]   = useState(null);
  const [toast, setToast]             = useState(null); // { msg, type }

  const { data, isLoading } = useLichTauCongList({ trang, search, trangthai: filterTT });
  const chuyenTT            = useChuyenTrangThaiCong();

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleChuyenTT = async (row) => {
    if (!confirming || confirming !== row.machuyentau) {
      setConfirming(row.machuyentau);
      return;
    }
    try {
      await chuyenTT.mutateAsync(row.machuyentau);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Không thể chuyển trạng thái.');
    } finally {
      setConfirming(null);
    }
  };

  const columns = [
    {
      key: 'sovoyage',
      label: 'Voyage No',
      width: 110,
      render: (v) => <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>,
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
    { key: 'tentau', label: 'Tên tàu', render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
    { key: 'cangxuatphat', label: 'Cảng xuất', render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
    {
      key: 'thoigiandukien',
      label: 'Dự kiến đến',
      render: (v) => <span style={{ fontSize: 13 }}>{v?.replace('T', ' ')?.slice(0, 16) || '—'}</span>,
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'actions',
      label: 'Hành động',
      align: 'center',
      width: 170,
      render: (_, row) => {
        const next = NEXT_ACTION[row.trangthai];
        if (!next) return <span style={{ color: '#cbd5e1' }}>—</span>;
        const isConfirm = confirming === row.machuyentau;
        return (
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            {isConfirm && (
              <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Hủy</Button>
            )}
            <Button
              size="sm"
              variant={isConfirm ? 'danger' : next.variant}
              onClick={() => handleChuyenTT(row)}
              disabled={chuyenTT.isPending}
            >
              {isConfirm ? 'Xác nhận?' : next.label}
            </Button>
          </div>
        );
      },
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Lịch tàu"
        subtitle="Theo dõi và cập nhật trạng thái chuyến tàu"
      />

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <form
          onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setTrang(1); }}
          style={{ display: 'flex', gap: 8, flex: 1 }}
        >
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm voyage, tên tàu, hãng tàu…"
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
          <option value="">Chờ xử lý (đặt mặc định)</option>
          <option value="dalenlich">Đã lên lịch</option>
          <option value="dadencang">Đã đến cảng</option>
          <option value="daroi">Đã rời</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Không có chuyến tàu nào" />
      <Pagination
        meta={meta}
        onChange={setTrang}
      />

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
