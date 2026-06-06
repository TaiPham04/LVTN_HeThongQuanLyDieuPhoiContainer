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
  useKhuVucBaiList,
  useThemKhuVucBai,
  useCapNhatKhuVucBai,
  useXoaKhuVucBai,
} from '@/hooks/useKhuVucBai';

/* ── helpers ── */
const tileColor = (pct) => {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f97316';
  if (pct >= 40) return '#eab308';
  return '#22c55e';
};

/* ── form mặc định ── */
const defaultValues = {
  makhuvuc: '',
  tenblock: '',
  sokhoang: '',
  sohang: '',
  sotang: '',
  lablock_lanh: false,
  soocamlanh: '',
};

export default function KhuVucBaiPage() {
  const [trang, setTrang] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [serverErr, setServerErr] = useState('');

  const { data, isLoading } = useKhuVucBaiList({ trang, search, per_page: 10 });
  const them = useThemKhuVucBai();
  const capNhat = useCapNhatKhuVucBai();
  const xoa = useXoaKhuVucBai();

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  const isLanh = watch('lablock_lanh');

  /* ── columns ── */
  const columns = [
    { key: 'makhuvuc', label: 'Mã khu vực', width: 110 },
    { key: 'tenblock', label: 'Tên khu vực' },
    {
      key: 'sokhoang',
      label: 'Khoang × Hàng × Tầng',
      align: 'center',
      render: (v, row) => (
        <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: 13 }}>
          {v} × {row.sohang} × {row.sotang}
        </span>
      ),
    },
    {
      key: 'tong_so_o',
      label: 'Tổng ô',
      align: 'center',
      render: (v) => <strong>{v ?? '—'}</strong>,
    },
    {
      key: 'ti_le_su_dung',
      label: 'Sử dụng',
      align: 'center',
      render: (v) => {
        const pct = parseFloat(v ?? 0);
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <div style={{ width: 72, height: 8, borderRadius: 4, background: '#e2e8f0', overflow: 'hidden' }}>
              <div style={{
                width: `${pct}%`, height: '100%',
                background: tileColor(pct), borderRadius: 4, transition: 'width .3s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: tileColor(pct), fontWeight: 600, minWidth: 36 }}>
              {pct.toFixed(1)}%
            </span>
          </div>
        );
      },
    },
    {
      key: 'lablock_lanh',
      label: 'Loại',
      align: 'center',
      render: (v) =>
        v ? <Badge variant="info">Lạnh</Badge> : <Badge variant="gray">Thường</Badge>,
    },
    {
      key: 'soocamlanh',
      label: 'Ổ cắm lạnh',
      align: 'center',
      render: (v, row) =>
        row.lablock_lanh
          ? v ?? 0
          : <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v) =>
        v === 'hoatdong'
          ? <Badge variant="success">Hoạt động</Badge>
          : <Badge variant="danger">Ngừng</Badge>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 140,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="ghost" onClick={() => openSua(row)}>Sửa</Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteRow(row)}>Xóa</Button>
        </div>
      ),
    },
  ];

  /* ── tính preview ô bãi ── */
  const soKhoang = parseInt(watch('sokhoang')) || 0;
  const soHang   = parseInt(watch('sohang'))   || 0;
  const soTang   = parseInt(watch('sotang'))   || 0;
  const tongOPreview = soKhoang * soHang * soTang;

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
      makhuvuc:    row.makhuvuc,
      tenblock:   row.tenblock,
      sokhoang:    row.sokhoang,
      sohang:      row.sohang,
      sotang:      row.sotang,
      lablock_lanh: row.lablock_lanh == 1,
      soocamlanh:  row.soocamlanh ?? '',
    });
    setServerErr('');
    setModalOpen(true);
  };

  /* ── submit ── */
  const onSubmit = async (values) => {
    setServerErr('');
    const payload = {
      ...values,
      sokhoang:   parseInt(values.sokhoang),
      sohang:     parseInt(values.sohang),
      sotang:     parseInt(values.sotang),
      lablock_lanh: values.lablock_lanh ? 1 : 0,
      soocamlanh: values.lablock_lanh ? parseInt(values.soocamlanh) || 0 : 0,
    };
    try {
      if (editRow) {
        await capNhat.mutateAsync({ makhuvuc: editRow.makhuvuc, ...payload });
      } else {
        await them.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (e) {
      const msg = e?.response?.data?.message || 'Đã có lỗi xảy ra.';
      const errs = e?.response?.data?.errors;
      if (errs) {
        setServerErr(Object.values(errs).flat().join(' • '));
      } else {
        setServerErr(msg);
      }
    }
  };

  /* ── xóa ── */
  const handleXoa = async ({ lydo, xacNhan }) => {
    try {
      await xoa.mutateAsync({
        makhuvuc: deleteRow.makhuvuc,
        lydo,
        xac_nhan: xacNhan,
      });
      setDeleteRow(null);
    } catch (e) {
      return e?.response?.data?.message || 'Lỗi khi xóa.';
    }
  };

  /* ── search ── */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setTrang(1);
  };

  const list  = data?.data ?? [];
  const meta  = data?.meta ?? {};

  /* ─────────── RENDER ─────────── */
  return (
    <div>
      <PageHeader
        title="Khu vực bãi"
        description="Quản lý các khu vực lưu trữ container trong cảng"
        action={<Button onClick={openThem}>+ Thêm khu vực</Button>}
      />

      {/* Thanh tìm kiếm */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Tìm theo mã hoặc tên khu vực…"
          style={{
            flex: 1, maxWidth: 320, padding: '8px 12px',
            border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 14, outline: 'none',
          }}
        />
        <Button type="submit" variant="secondary">Tìm</Button>
        {search && (
          <Button
            variant="ghost"
            onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}
          >
            Xóa lọc
          </Button>
        )}
      </form>

      {/* Bảng */}
      <Table
        columns={columns}
        data={list}
        loading={isLoading}
      />

      {/* Phân trang */}
      {meta.last_page > 1 && (
        <Pagination
          current={meta.current_page}
          total={meta.last_page}
          onChange={setTrang}
        />
      )}

      {/* ── Modal Thêm / Sửa ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? `Sửa khu vực — ${editRow.makhuvuc}` : 'Thêm khu vực bãi'}
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

          {/* Mã + Tên */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Mã khu vực"
              placeholder="A, B, C…"
              disabled={!!editRow}
              error={errors.makhuvuc?.message}
              {...register('makhuvuc', {
                required: 'Bắt buộc',
                maxLength: { value: 10, message: 'Tối đa 10 ký tự' },
              })}
            />
            <Input
              label="Tên khu vực"
              placeholder="VD: Khu A — Container thường"
              error={errors.tenblock?.message}
              {...register('tenblock', {
                required: 'Bắt buộc',
                maxLength: { value: 100, message: 'Tối đa 100 ký tự' },
              })}
            />
          </div>

          {/* Khoang × Hàng × Tầng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Số khoang"
              type="number"
              min={1}
              placeholder="VD: 10"
              error={errors.sokhoang?.message}
              {...register('sokhoang', {
                required: 'Bắt buộc',
                min: { value: 1, message: '≥ 1' },
              })}
            />
            <Input
              label="Số hàng"
              type="number"
              min={1}
              placeholder="VD: 6"
              error={errors.sohang?.message}
              {...register('sohang', {
                required: 'Bắt buộc',
                min: { value: 1, message: '≥ 1' },
              })}
            />
            <Input
              label="Số tầng"
              type="number"
              min={1}
              placeholder="VD: 4"
              error={errors.sotang?.message}
              {...register('sotang', {
                required: 'Bắt buộc',
                min: { value: 1, message: '≥ 1' },
              })}
            />
          </div>

          {/* Preview tổng ô */}
          {tongOPreview > 0 && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0',
              borderRadius: 8, padding: '8px 14px',
              fontSize: 13, color: '#15803d', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>📦</span>
              <span>
                Sẽ tạo tự động <strong>{tongOPreview.toLocaleString()}</strong> ô bãi
                ({soKhoang} khoang × {soHang} hàng × {soTang} tầng)
              </span>
            </div>
          )}

          {/* Bãi lạnh */}
          <div style={{ marginBottom: 14 }}>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              cursor: 'pointer', fontSize: 14, color: '#374151', userSelect: 'none',
            }}>
              <input
                type="checkbox"
                style={{ width: 16, height: 16, accentColor: '#e8920a' }}
                {...register('lablock_lanh')}
              />
              <span>Khu vực bãi lạnh (Reefer)</span>
            </label>
          </div>

          {/* Ổ cắm lạnh — chỉ hiện khi tích bãi lạnh */}
          {isLanh && (
            <div style={{ marginBottom: 4 }}>
              <Input
                label="Số ổ cắm lạnh"
                type="number"
                min={0}
                placeholder="VD: 48"
                error={errors.soocamlanh?.message}
                {...register('soocamlanh', {
                  required: isLanh ? 'Bắt buộc khi là bãi lạnh' : false,
                  min: { value: 0, message: '≥ 0' },
                })}
              />
            </div>
          )}

          {/* Nút */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : editRow ? 'Cập nhật' : 'Thêm khu vực'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Xóa ── */}
      {deleteRow && (
        <ConfirmDelete
          open={!!deleteRow}
          onClose={() => setDeleteRow(null)}
          onConfirm={handleXoa}
          identifier={deleteRow.makhuvuc}
          tenHienThi={`khu vực ${deleteRow.tenblock}`}
          loading={xoa.isPending}
        />
      )}
    </div>
  );
}