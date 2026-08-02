import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import Input from '@/components/ui/Input';
import {
  useKhuVucBaiList,
  useThemKhuVucBai,
  useCapNhatKhuVucBai,
  useXoaKhuVucBai,
} from '@/hooks/admin/useKhuVucBai';

/* ── helpers ── */
const tileColor = (pct) => {
  if (pct >= 90) return '#ef4444';
  if (pct >= 70) return '#f97316';
  if (pct >= 40) return '#eab308';
  return '#22c55e';
};

const NHOM_OPTIONS = [
  { value: 'dry',        label: 'Khô (Dry)' },
  { value: 'reefer',     label: 'Lạnh (Reefer)' },
  { value: 'open_top',   label: 'Open Top' },
  { value: 'flat_rack',  label: 'Flat Rack' },
  { value: 'platform',   label: 'Platform' },
  { value: 'hazmat',     label: 'Hàng nguy hiểm' },
  { value: 'ventilated', label: 'Thông gió' },
];

const NHOM_VARIANT = {
  dry:        'gray',
  reefer:     'info',
  open_top:   'warning',
  flat_rack:  'secondary',
  platform:   'secondary',
  hazmat:     'danger',
  ventilated: 'gray',
};

const nhomLabel = (v) => NHOM_OPTIONS.find(o => o.value === v)?.label ?? v;

const LUONG_OPTIONS = [
  { value: 'xuat', label: 'Xuất' },
  { value: 'nhap', label: 'Nhập' },
];

/* ── Nhóm khu vực bãi theo luồng ưu tiên — mỗi khu vực chuyên biệt 1 area ── */
const AREA_GROUPS = [
  { key: 'xuat', title: 'Khu vực Xuất', color: '#c2410c' },
  { key: 'nhap', title: 'Khu vực Nhập', color: '#0369a1' },
];

/* ── form mặc định ── */
const defaultValues = {
  tenblock: '',
  loai_hinh_uutien: 'xuat',
  sokhoang: '',
  sohang: '',
  sotang: '',
  loai_nhom: 'dry',
};

export default function KhuVucBaiPage() {
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [deleteRow, setDeleteRow] = useState(null);
  const [serverErr, setServerErr] = useState('');

  // Số khu vực bãi luôn ít (dữ liệu cấu hình, không phải giao dịch) nên lấy hết 1 lần
  // để nhóm hiển thị theo area — không cần phân trang.
  const { data, isLoading } = useKhuVucBaiList({ search, per_page: 100 });
  const them    = useThemKhuVucBai();
  const capNhat = useCapNhatKhuVucBai();
  const xoa     = useXoaKhuVucBai();

  const {
    register, handleSubmit, reset, watch,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues });

  const watchLuong = watch('loai_hinh_uutien');

  /* ── columns ── */
  const columns = [
    { key: 'makhuvuc', label: 'Mã', width: 70 },
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
      key: 'loai_nhom',
      label: 'Nhóm container',
      align: 'center',
      render: (v) => (
        <Badge variant={NHOM_VARIANT[v] ?? 'gray'}>{nhomLabel(v)}</Badge>
      ),
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
  const [soKhoangW, setSoKhoangW] = useState('');
  const [soHangW, setSoHangW] = useState('');
  const [soTangW, setSoTangW] = useState('');
  const tongOPreview = (parseInt(soKhoangW) || 0) * (parseInt(soHangW) || 0) * (parseInt(soTangW) || 0);

  /* ── mở modal ── */
  const openThem = () => {
    setEditRow(null);
    reset(defaultValues);
    setSoKhoangW(''); setSoHangW(''); setSoTangW('');
    setServerErr('');
    setModalOpen(true);
  };

  const openSua = (row) => {
    setEditRow(row);
    reset({
      tenblock:  row.tenblock,
      loai_hinh_uutien: row.loai_hinh_uutien ?? 'xuat',
      sokhoang:  row.sokhoang,
      sohang:    row.sohang,
      sotang:    row.sotang,
      loai_nhom: row.loai_nhom ?? 'dry',
    });
    setSoKhoangW(String(row.sokhoang));
    setSoHangW(String(row.sohang));
    setSoTangW(String(row.sotang));
    setServerErr('');
    setModalOpen(true);
  };

  /* ── submit ── */
  const onSubmit = async (values) => {
    setServerErr('');
    const payload = {
      tenblock:   values.tenblock,
      sokhoang:   parseInt(values.sokhoang),
      sohang:     parseInt(values.sohang),
      sotang:     parseInt(values.sotang),
      loai_nhom:  values.loai_nhom,
      loai_hinh_uutien: values.loai_hinh_uutien,
    };
    try {
      if (editRow) {
        await capNhat.mutateAsync({ makhuvuc: editRow.makhuvuc, ...payload });
      } else {
        await them.mutateAsync(payload);
      }
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs
        ? Object.values(errs).flat().join(' • ')
        : e?.response?.data?.message || 'Đã có lỗi xảy ra.'
      );
    }
  };

  /* ── xóa ── */
  const handleXoa = async ({ lydo, xacNhan }) => {
    try {
      await xoa.mutateAsync({ makhuvuc: deleteRow.makhuvuc, lydo, xac_nhan: xacNhan });
      setDeleteRow(null);
    } catch (e) {
      return e?.response?.data?.message || 'Lỗi khi xóa.';
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const list = data?.data ?? [];

  /* ─────────── RENDER ─────────── */
  return (
    <div>
      <PageHeader
        title="Khu vực bãi"
        description="Quản lý các khu vực lưu trữ container — mỗi khu vực chuyên biệt cho 1 luồng Xuất hoặc Nhập"
        action={<Button onClick={openThem}>+ Thêm khu vực</Button>}
      />

      <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="Tìm theo tên khu vực…"
          style={{
            flex: 1, maxWidth: 320, padding: '8px 12px',
            border: '1px solid #e2e8f0', borderRadius: 8,
            fontSize: 14, outline: 'none',
          }}
        />
        <Button type="submit" variant="secondary">Tìm</Button>
        {search && (
          <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); }}>
            Xóa lọc
          </Button>
        )}
      </form>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: 48, color: '#6b7280', fontSize: 14 }}>
          Đang tải…
        </div>
      )}

      {!isLoading && list.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 0', color: '#9ca3af', fontSize: 14,
          background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0',
        }}>
          Không tìm thấy khu vực bãi nào
        </div>
      )}

      {!isLoading && list.length > 0 && AREA_GROUPS.map(g => {
        const rows = list.filter(r => r.loai_hinh_uutien === g.key);
        if (rows.length === 0) return null;
        return (
          <div key={g.key} style={{ marginBottom: 24 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
              fontSize: 14, fontWeight: 700, color: g.color,
            }}>
              {g.title}
              <span style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af' }}>({rows.length})</span>
            </div>
            <Table columns={columns} data={rows} />
          </div>
        );
      })}

      {/* ── Modal Thêm / Sửa ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? `Sửa khu vực — ${editRow.makhuvuc}` : 'Thêm khu vực bãi'}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
              padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16,
            }}>
              {serverErr}
            </div>
          )}

          <div style={{ marginBottom: 4 }}>
            <Input
              label="Tên khu vực"
              placeholder="VD: Khu A — Dry container"
              disabled={!!editRow}
              error={errors.tenblock?.message}
              {...register('tenblock', {
                required: 'Bắt buộc',
                maxLength: { value: 100, message: 'Tối đa 100 ký tự' },
              })}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Luồng (khu vực) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {LUONG_OPTIONS.map(o => {
                const checked = watchLuong === o.value;
                return (
                  <label key={o.value} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '9px 12px', border: `2px solid ${checked ? '#0d6efd' : '#e2e8f0'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: checked ? '#eff6ff' : '#fff',
                    fontSize: 14, fontWeight: checked ? 600 : 400,
                  }}>
                    <input type="radio" value={o.value} {...register('loai_hinh_uutien', { required: 'Bắt buộc' })} style={{ accentColor: '#0d6efd' }} />
                    {o.label}
                  </label>
                );
              })}
            </div>
            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
              Mỗi khu vực bãi chuyên biệt cho đúng 1 luồng — container sai luồng sẽ không được gán/gợi ý vào đây.
            </p>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>
              Nhóm container <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              style={{
                width: '100%', padding: '8px 12px',
                border: `1px solid ${errors.loai_nhom ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 8, fontSize: 14, background: '#fff', outline: 'none', cursor: 'pointer',
              }}
              {...register('loai_nhom', { required: 'Bắt buộc' })}
            >
              {NHOM_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {errors.loai_nhom && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.loai_nhom.message}</p>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Số khoang"
              type="number" min={1}
              error={errors.sokhoang?.message}
              {...register('sokhoang', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' },
                onChange: e => setSoKhoangW(e.target.value) })}
            />
            <Input
              label="Số hàng"
              type="number" min={1}
              error={errors.sohang?.message}
              {...register('sohang', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' },
                onChange: e => setSoHangW(e.target.value) })}
            />
            <Input
              label="Số tầng"
              type="number" min={1}
              error={errors.sotang?.message}
              {...register('sotang', { required: 'Bắt buộc', min: { value: 1, message: '≥ 1' },
                onChange: e => setSoTangW(e.target.value) })}
            />
          </div>

          {tongOPreview > 0 && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8,
              padding: '8px 14px', fontSize: 13, color: '#15803d', marginBottom: 14,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>📦</span>
              <span>Sẽ tạo tự động <strong>{tongOPreview.toLocaleString()}</strong> ô bãi</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : editRow ? 'Cập nhật' : 'Thêm khu vực'}
            </Button>
          </div>
        </form>
      </Modal>

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
