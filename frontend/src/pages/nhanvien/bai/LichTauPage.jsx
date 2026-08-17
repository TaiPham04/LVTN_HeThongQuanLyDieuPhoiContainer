import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Pagination from '@/components/ui/Pagination';
import { useLichTauBaiList, useChuyenTrangThaiBai } from '@/hooks/nhanvien/useLichTauBai';

const daDeoDen = (thoigiandukien) => {
  if (!thoigiandukien) return true;
  const ngayDuKien = new Date(thoigiandukien);
  ngayDuKien.setHours(0, 0, 0, 0);
  const homNay = new Date();
  homNay.setHours(0, 0, 0, 0);
  return homNay >= ngayDuKien;
};

const fmtDT = (v) => v?.replace('T', ' ')?.slice(0, 16) || '—';

const trangThaiBadge = (v) => {
  switch (v) {
    case 'dalenlich': return <Badge variant="info">Đã lên lịch</Badge>;
    case 'dadencang':  return <Badge variant="warning">Đã đến cảng</Badge>;
    case 'daroi':     return <Badge variant="success">Đã rời</Badge>;
    case 'dahuy':     return <Badge variant="danger">Đã hủy</Badge>;
    default:          return <Badge variant="gray">{v}</Badge>;
  }
};


export default function LichTauBaiPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  // confirming dùng cho doHang và roiBen (inline confirm trong table)
  const [confirming, setConfirming]   = useState(null);
  // dialog xác nhận tàu đến cảng
  const [dialogRow, setDialogRow]     = useState(null);
  const [successMsg, setSuccessMsg]   = useState('');
  const [errorMsg, setErrorMsg]       = useState('');

  const navigate = useNavigate();
  const { data, isLoading } = useLichTauBaiList({ trang, search, trangthai: filterTT });
  const chuyenTT = useChuyenTrangThaiBai();
  const isPending = chuyenTT.isPending;

  const showSuccess = (msg) => {
    setSuccessMsg(msg); setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 7000);
  };
  const showError = (msg) => {
    setErrorMsg(msg); setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 7000);
  };

  // Xác nhận tàu đến cảng — qua dialog
  const handleDenCang = async () => {
    if (!dialogRow) return;
    const id = dialogRow.machuyentau;
    setDialogRow(null);
    try {
      const res = await chuyenTT.mutateAsync(id);
      showSuccess(res.message);
    } catch (e) {
      showError(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
    }
  };

  // Inline confirm cho roiBen
  const handleRoiBen = async (machuyentau) => {
    if (!confirming || confirming.id !== machuyentau) {
      setConfirming({ id: machuyentau });
      return;
    }
    setConfirming(null);
    try {
      const res = await chuyenTT.mutateAsync(machuyentau);
      showSuccess(res.message);
    } catch (e) {
      showError(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
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
    { key: 'tentau',       label: 'Tên tàu',   render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
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
      width: 240,
      render: (_, row) => {
        const { machuyentau, trangthai } = row;
        const conf = confirming?.id === machuyentau ? confirming.action : null;

        if (trangthai === 'dalenlich') {
          const coThe = daDeoDen(row.thoigiandukien);
          return (
            <Button
              size="sm"
              style={coThe
                ? { background: '#16a34a', color: '#fff', border: 'none', cursor: 'pointer' }
                : { background: '#e5e7eb', color: '#9ca3af', border: 'none', cursor: 'not-allowed' }
              }
              disabled={!coThe || isPending}
              onClick={() => coThe && setDialogRow(row)}
            >
              Ghi nhận đến cảng
            </Button>
          );
        }

        if (trangthai === 'dadencang') {
          const conHangChoDo = (row.so_container_cho_do ?? 0) > 0;

          // Đang xác nhận rời bến
          if (conf) {
            return (
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>Hủy</Button>
                <Button size="sm" variant="danger"
                  onClick={() => handleRoiBen(machuyentau)}
                  disabled={isPending}
                >
                  Xác nhận rời bến?
                </Button>
              </div>
            );
          }

          return (
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center' }}>
              <Button size="sm" variant="primary"
                onClick={() => navigate('/nv/bai/tiep-nhan-nhap', { state: { chuyentau: row } })}
              >
                Dỡ hàng
              </Button>
              {!conHangChoDo && (
                <Button size="sm" variant="secondary"
                  onClick={() => handleRoiBen(machuyentau)}
                  disabled={isPending}
                >
                  Rời bến
                </Button>
              )}
            </div>
          );
        }

        return <span style={{ color: '#cbd5e1' }}>—</span>;
      },
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Lịch tàu"
        subtitle="Theo dõi và cập nhật trạng thái chuyến tàu vào bãi"
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
          <option value="">Chờ xử lý (mặc định)</option>
          <option value="dalenlich">Đã lên lịch</option>
          <option value="dadencang">Đã đến cảng</option>
          <option value="daroi">Đã rời</option>
        </select>
      </div>

      {successMsg && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          {errorMsg}
        </div>
      )}

      <Table columns={columns} data={list} loading={isLoading} emptyText="Không có chuyến tàu nào" />
      <Pagination meta={meta} onChange={setTrang} />

      {/* ── Dialog xác nhận tàu đến cảng ── */}
      <Modal
        open={!!dialogRow}
        onClose={() => setDialogRow(null)}
        title="Xác nhận tàu đến cảng"
        width={440}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setDialogRow(null)}>Hủy</Button>
            <Button
              style={{ background: '#16a34a', color: '#fff', border: 'none' }}
              onClick={handleDenCang}
              disabled={chuyenTT.isPending}
            >
              {chuyenTT.isPending ? 'Đang xử lý…' : 'Xác nhận tàu đã cập cảng'}
            </Button>
          </div>
        }
      >
        {dialogRow && (
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '4px 8px', marginBottom: 16 }}>
              <span style={{ color: '#6b7280' }}>Voyage No</span>
              <strong style={{ fontFamily: 'monospace', fontSize: 15 }}>{dialogRow.sovoyage}</strong>
              <span style={{ color: '#6b7280' }}>Tàu</span>
              <span>{dialogRow.tentau}</span>
              <span style={{ color: '#6b7280' }}>Hãng tàu</span>
              <span>{dialogRow.mascac} — {dialogRow.tenhangtau}</span>
              <span style={{ color: '#6b7280' }}>Hành trình</span>
              <span>{dialogRow.cangxuatphat} → {dialogRow.cangdich}</span>
              <span style={{ color: '#6b7280' }}>Dự kiến đến</span>
              <span>{fmtDT(dialogRow.thoigiandukien)}</span>
            </div>
            <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', color: '#15803d', fontSize: 13 }}>
              Xác nhận sẽ chuyển trạng thái chuyến tàu sang <strong>"Đã đến cảng"</strong>. Sau đó nhân viên bãi có thể thực hiện dỡ hàng toàn bộ container của chuyến này vào bãi.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
