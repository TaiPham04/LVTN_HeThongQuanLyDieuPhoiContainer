import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import {
  useChuyenTauList,
  useThemChuyenTau,
  useCapNhatChuyenTau,
  useHuyChuyenTau,
  useChuyenTrangThai,
} from '@/hooks/admin/useChuyenTau';
import { useHangTauList } from '@/hooks/admin/useHangTau';

/* ── helpers ── */
const trangThaiBadge = (v) => {
  switch (v) {
    case 'dalenlich': return <Badge variant="info">Đã lên lịch</Badge>;
    case 'dadencan':  return <Badge variant="warning">Đã đến cảng</Badge>;
    case 'daroi':     return <Badge variant="success">Đã rời</Badge>;
    case 'dahuy':     return <Badge variant="danger">Đã hủy</Badge>;
    default:          return <Badge variant="gray">{v}</Badge>;
  }
};

const fmtDT = (v) => {
  if (!v) return '—';
  return v.replace('T', ' ');
};

const defaultValues = {
  mahangtau: '',
  tentau: '',
  sovoyage: '',
  cangxuatphat: '',
  cangdich: '',
  thoigiandukien: '',
  thoigianroiben: '',
  socontainerdukien: '',
};

export default function LichTauPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [editRow, setEditRow]         = useState(null);
  const [deleteRow, setDeleteRow]     = useState(null);
  const [serverErr, setServerErr]     = useState('');

  const { data, isLoading }  = useChuyenTauList({ trang, search, trangthai: filterTT, per_page: 10 });
  const { data: htData }     = useHangTauList({ per_page: 100 });
  const them          = useThemChuyenTau();
  const capNhat       = useCapNhatChuyenTau();
  const huy           = useHuyChuyenTau();
  const chuyenTT      = useChuyenTrangThai();

  const {
    register, handleSubmit, reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  /* ── columns ── */
  const columns = [
    { key: 'sovoyage', label: 'Voyage No', width: 110 },
    {
      key: 'mahangtau',
      label: 'Hãng tàu',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.mascac}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tenhangtau}</div>
        </div>
      ),
    },
    { key: 'tentau', label: 'Tên tàu' },
    {
      key: 'cangxuatphat',
      label: 'Hành trình',
      render: (_, row) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {row.cangxuatphat} → {row.cangdich}
        </span>
      ),
    },
    {
      key: 'thoigiandukien',
      label: 'Dự kiến đến',
      render: (v) => <span style={{ fontSize: 12 }}>{fmtDT(v)}</span>,
    },
    {
      key: 'thoigianroiben',
      label: 'Dự kiến rời',
      render: (v) => <span style={{ fontSize: 12 }}>{fmtDT(v)}</span>,
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 200,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
          {row.trangthai === 'dalenlich' && (
            <Button
              size="sm" variant="warning"
              disabled={chuyenTT.isPending}
              onClick={() => chuyenTT.mutate(row.machuyentau)}
            >Đã đến cảng</Button>
          )}
          {row.trangthai === 'dadencan' && (
            <Button
              size="sm" variant="success"
              disabled={chuyenTT.isPending}
              onClick={() => chuyenTT.mutate(row.machuyentau)}
            >Đã rời bến</Button>
          )}
          <Button
            size="sm" variant="ghost"
            onClick={() => openSua(row)}
            disabled={['daroi', 'dahuy'].includes(row.trangthai)}
          >Sửa</Button>
          <Button
            size="sm" variant="danger"
            onClick={() => setDeleteRow(row)}
            disabled={row.trangthai === 'dahuy'}
          >Hủy</Button>
        </div>
      ),
    },
  ];

  /* ── mở modal ── */
  const openThem = () => {
    setEditRow(null);
    reset(defaultValues);
    setServerErr('');
    setModalOpen(true);
  };

  const openSua = (row) => {
    setEditRow(row);
    reset({
      mahangtau:         String(row.mahangtau),
      tentau:            row.tentau,
      sovoyage:          row.sovoyage,
      cangxuatphat:      row.cangxuatphat,
      cangdich:          row.cangdich,
      thoigiandukien:    row.thoigiandukien ?? '',
      thoigianroiben:    row.thoigianroiben ?? '',
      socontainerdukien: row.socontainerdukien ?? '',
    });
    setServerErr('');
    setModalOpen(true);
  };

  /* ── submit ── */
  const onSubmit = async (values) => {
    setServerErr('');
    const payload = {
      ...values,
      mahangtau:         parseInt(values.mahangtau),
      socontainerdukien: values.socontainerdukien ? parseInt(values.socontainerdukien) : null,
    };
    try {
      if (editRow) {
        await capNhat.mutateAsync({ machuyentau: editRow.machuyentau, ...payload });
      } else {
        await them.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      if (errs) {
        setServerErr(Object.values(errs).flat().join(' • '));
      } else {
        setServerErr(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
      }
    }
  };

  /* ── hủy ── */
  const handleHuy = async ({ lydo, xacNhan }) => {
    try {
      await huy.mutateAsync({
        machuyentau: deleteRow.machuyentau,
        lydo_xoa:    lydo,
        xacnhan_xoa: xacNhan,
      });
      setDeleteRow(null);
    } catch (e) {
      return e?.response?.data?.message || 'Lỗi khi hủy.';
    }
  };

  /* ── search ── */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setTrang(1);
  };

  const list             = data?.data ?? [];
  const meta             = data?.meta ?? {};
  const danhSachHangTau  = htData?.data ?? [];

  /* ─────────── RENDER ─────────── */
  return (
    <div>
      <PageHeader
        title="Lịch tàu"
        description="Quản lý lịch chạy tàu và chuyến tàu ra vào cảng"
        action={<Button onClick={openThem}>+ Thêm lịch tàu</Button>}
      />

      {/* Thanh tìm kiếm + lọc trạng thái */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo voyage, tên tàu, hãng tàu…"
            style={{
              flex: 1, maxWidth: 340, padding: '8px 12px',
              border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 14, outline: 'none',
            }}
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
          style={{
            padding: '8px 12px', border: '1px solid #e2e8f0',
            borderRadius: 8, fontSize: 13, outline: 'none',
            background: '#fff', cursor: 'pointer',
          }}
        >
          <option value="">Đang hoạt động</option>
          <option value="dalenlich">Đã lên lịch</option>
          <option value="dadencan">Đã đến cảng</option>
          <option value="daroi">Đã rời</option>
          <option value="dahuy">Đã hủy</option>
        </select>
      </div>

      {/* Bảng */}
      <Table
        columns={columns}
        data={list}
        loading={isLoading}
        emptyText="Chưa có lịch tàu nào"
      />

      {/* Phân trang */}
      <Pagination
        meta={{ trang_hien: meta.current_page, tong_trang: meta.last_page, tong: meta.total, per_page: meta.per_page }}
        onChange={setTrang}
      />

      {/* ── Modal Thêm / Sửa ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? `Sửa lịch tàu — ${editRow.sovoyage}` : 'Thêm lịch tàu'}
        width={580}
      >
        <form onSubmit={handleSubmit(onSubmit)}>

          {serverErr && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              color: '#dc2626', fontSize: 13, marginBottom: 16,
            }}>
              {serverErr}
            </div>
          )}

          {/* Hãng tàu */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Hãng tàu <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              style={{
                width: '100%', padding: '8px 12px',
                border: `1px solid ${errors.mahangtau ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
              }}
              {...register('mahangtau', { required: 'Vui lòng chọn hãng tàu.' })}
            >
              <option value="">— Chọn hãng tàu —</option>
              {danhSachHangTau.map(ht => (
                <option key={ht.mahangtau} value={ht.mahangtau}>
                  {ht.mascac} — {ht.tenhangtau}
                </option>
              ))}
            </select>
            {errors.mahangtau && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.mahangtau.message}</p>
            )}
          </div>

          {/* Tên tàu + Số voyage */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Tên tàu"
              placeholder="VD: Ever Given"
              error={errors.tentau?.message}
              {...register('tentau', {
                required: 'Vui lòng nhập tên tàu.',
                maxLength: { value: 255, message: 'Tối đa 255 ký tự' },
              })}
            />
            <Input
              label="Số voyage"
              placeholder="VD: 0123E"
              disabled={!!editRow}
              error={errors.sovoyage?.message}
              {...register('sovoyage', {
                required: 'Vui lòng nhập số voyage.',
                maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
              })}
            />
          </div>

          {/* Cảng xuất phát + Cảng đích */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Cảng xuất phát"
              placeholder="VD: SGSIN"
              error={errors.cangxuatphat?.message}
              {...register('cangxuatphat', {
                required: 'Vui lòng nhập cảng xuất phát.',
                maxLength: { value: 5, message: 'Tối đa 5 ký tự' },
              })}
            />
            <Input
              label="Cảng đích"
              placeholder="VD: VNCLI"
              error={errors.cangdich?.message}
              {...register('cangdich', {
                required: 'Vui lòng nhập cảng đích.',
                maxLength: { value: 5, message: 'Tối đa 5 ký tự' },
              })}
            />
          </div>

          {/* Thời gian */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Dự kiến đến cảng"
              type="datetime-local"
              error={errors.thoigiandukien?.message}
              {...register('thoigiandukien', { required: 'Bắt buộc.' })}
            />
            <Input
              label="Dự kiến rời bến"
              type="datetime-local"
              error={errors.thoigianroiben?.message}
              {...register('thoigianroiben', { required: 'Bắt buộc.' })}
            />
          </div>

          {/* Số container dự kiến */}
          <div style={{ marginBottom: 4 }}>
            <Input
              label="Số container dự kiến (không bắt buộc)"
              type="number"
              min={1}
              placeholder="VD: 500"
              error={errors.socontainerdukien?.message}
              {...register('socontainerdukien')}
            />
          </div>

          {/* Nút */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : editRow ? 'Cập nhật' : 'Thêm lịch tàu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Xác nhận hủy ── */}
      {deleteRow && (
        <ConfirmDelete
          open={!!deleteRow}
          onClose={() => setDeleteRow(null)}
          onConfirm={handleHuy}
          identifier={deleteRow.sovoyage}
          tenHienThi={`chuyến tàu ${deleteRow.sovoyage} — ${deleteRow.tentau}`}
          loading={huy.isPending}
        />
      )}
    </div>
  );
}
