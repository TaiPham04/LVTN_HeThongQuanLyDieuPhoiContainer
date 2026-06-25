import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { useContainerCongList, useDangKyContainer, useCapNhatHaiQuanCong } from '@/hooks/nhanvien/useContainerCong';
import { HaiQuanModal } from '@/pages/admin/ContainerPage';

/* ── helpers ── */
const trangThaiBadge = (v) => {
  const map = {
    dangky:        { label: 'Đăng ký',    variant: 'info' },
    trongbai:      { label: 'Trong bãi',  variant: 'success' },
    xuatcong:      { label: 'Xuất cổng',  variant: 'warning' },
    dalenken:      { label: 'Đã lên kẹn', variant: 'gray' },
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

const selectStyle = (hasError) => ({
  width: '100%', padding: '8px 12px',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
});

const defaultValues = {
  socontainer: '',
  maloai: '',
  mahangtau: '',
  kichthuoc: '20',
  loaihang: 'kho',
  trong_luong: '',
  ghichu: '',
};

export default function ContainerCongPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [serverErr, setServerErr]     = useState('');
  const [hqRow, setHqRow]             = useState(null);
  const [hqTT, setHqTT]               = useState('');
  const [hqGhiChu, setHqGhiChu]       = useState('');

  const { data, isLoading } = useContainerCongList({ trang, search, trangthai: filterTT });
  const dangKy              = useDangKyContainer();
  const capNhatHQ           = useCapNhatHaiQuanCong();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  const openThem = () => {
    reset(defaultValues);
    setServerErr('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      await dangKy.mutateAsync({
        ...values,
        socontainer: values.socontainer.toUpperCase(),
        trong_luong: values.trong_luong ? Number(values.trong_luong) : undefined,
      });
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi xảy ra.'));
    }
  };

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
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'trangthai_haiquan',
      label: 'Hải quan',
      align: 'center',
      render: (v) => v ? haiquanBadge(v) : <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      key: 'thoigian_vaobai',
      label: 'Vào bãi',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 110,
      render: (_, row) => (
        <Button
          size="sm"
          variant={row.trangthai_haiquan === 'luong_xanh' ? 'secondary' : 'ghost'}
          onClick={() => { setHqRow(row); setHqTT(row.trangthai_haiquan); setHqGhiChu(''); }}
          title="Cập nhật trạng thái hải quan"
        >
          Cập nhật HQ
        </Button>
      ),
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Container"
        description="Đăng ký và tra cứu container tại cổng"
        action={<Button onClick={openThem}>+ Đăng ký container</Button>}
      />

      {/* Thanh lọc */}
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
          <option value="">Tất cả trạng thái</option>
          <option value="dangky">Đăng ký</option>
          <option value="trongbai">Trong bãi</option>
          <option value="xuatcong">Xuất cổng</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có container nào" />
      <Pagination
        meta={meta}
        onChange={setTrang}
      />

      {/* ── Modal Cập nhật hải quan ── */}
      {hqRow && (
        <Modal
          open={!!hqRow}
          onClose={() => setHqRow(null)}
          title={`Cập nhật hải quan — ${hqRow.socontainer}`}
          width={420}
        >
          <HaiQuanModal
            row={hqRow}
            value={hqTT}
            onChange={setHqTT}
            ghichu={hqGhiChu}
            onGhichuChange={setHqGhiChu}
            loading={capNhatHQ.isPending}
            onSubmit={async () => {
              await capNhatHQ.mutateAsync({ macontainer: hqRow.macontainer, trangthai_haiquan: hqTT, ghichu_haiquan: hqGhiChu });
              setHqRow(null);
            }}
            onClose={() => setHqRow(null)}
          />
        </Modal>
      )}

      {/* ── Modal đăng ký ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Đăng ký container mới" width={480}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {serverErr}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <Input
              label="Số container"
              placeholder="VD: MSCU1234567"
              error={errors.socontainer?.message}
              {...register('socontainer', {
                required: 'Số container là bắt buộc.',
                minLength: { value: 11, message: 'Số container phải có 11 ký tự.' },
                onChange: (e) => { e.target.value = e.target.value.toUpperCase().replace(/\s/g, ''); },
              })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Kích thước <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select style={selectStyle(false)} {...register('kichthuoc', { required: true })}>
                <option value="20">20ft</option>
                <option value="40">40ft</option>
                <option value="45">45ft</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Loại hàng <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select style={selectStyle(false)} {...register('loaihang', { required: true })}>
                <option value="kho">Khô</option>
                <option value="lanh">Lạnh</option>
                <option value="nguy_hiem">Nguy hiểm</option>
                <option value="qua_kho">Quá khổ</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Input
              label="Trọng lượng (kg)"
              type="number"
              placeholder="VD: 12000"
              error={errors.trong_luong?.message}
              {...register('trong_luong', { min: { value: 0, message: 'Trọng lượng phải ≥ 0.' } })}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Ghi chú
            </label>
            <textarea
              rows={3}
              placeholder="Ghi chú thêm nếu có…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              {...register('ghichu')}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : 'Đăng ký'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
