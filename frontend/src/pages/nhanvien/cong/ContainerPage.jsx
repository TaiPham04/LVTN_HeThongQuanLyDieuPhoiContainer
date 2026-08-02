import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import LoaiContainerSelect from '@/components/shared/LoaiContainerSelect';
import { useContainerCongList, useDangKyContainer } from '@/hooks/nhanvien/useContainerCong';
import { useLoaiContainerList } from '@/hooks/admin/useLoaiContainer';
import { useChuyenTauList } from '@/hooks/admin/useChuyenTau';

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

const thongQuanBadge = (daThongQuan) =>
  daThongQuan
    ? <Badge variant="success">Đã thông quan</Badge>
    : <Badge variant="gray">Chưa thông quan</Badge>;

const selectStyle = (hasError) => ({
  width: '100%', padding: '8px 12px',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
});

const defaultValues = {
  socontainer: '',
  loai_hinh: 'nhap',
  machuyentau: '',
  soniemchi: '',
  trongluong_kg: '',
  mota_hanghoa: '',
};

export default function ContainerCongPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [serverErr, setServerErr]     = useState('');
  const [maloaiChon, setMaloaiChon]   = useState('');

  const { data, isLoading }    = useContainerCongList({ trang, search, trangthai: filterTT });
  const { data: loaiData }     = useLoaiContainerList({ per_page: 100 });
  const { data: ctData }       = useChuyenTauList({ per_page: 100 });
  const dangKy                 = useDangKyContainer();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  const openThem = () => {
    reset(defaultValues);
    setMaloaiChon('');
    setServerErr('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    if (!maloaiChon) { setServerErr('Vui lòng chọn loại và kích thước container.'); return; }
    try {
      await dangKy.mutateAsync({
        ...values,
        maloai:        parseInt(maloaiChon),
        machuyentau:   parseInt(values.machuyentau),
        socontainer:   values.socontainer.toUpperCase(),
        trongluong_kg: values.trongluong_kg ? Number(values.trongluong_kg) : undefined,
      });
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi xảy ra.'));
    }
  };

  const loaiHinhBadge = (v) => (
    <Badge variant={v === 'nhap' ? 'info' : 'warning'}>{v === 'nhap' ? 'Nhập khẩu' : 'Xuất khẩu'}</Badge>
  );

  const columns = [
    {
      key: 'socontainer',
      label: 'Số container',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.maiso} — {row.tenloai}</div>
        </div>
      ),
    },
    {
      key: 'loai_hinh',
      label: 'Loại hình',
      align: 'center',
      render: (v) => loaiHinhBadge(v),
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
      render: (v, row) => v ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {haiquanBadge(v)}
          {thongQuanBadge(row.da_thong_quan)}
        </div>
      ) : <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      key: 'thoigian_vaobai',
      label: 'Vào bãi',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
  ];

  const list         = data?.data ?? [];
  const meta         = data?.meta ?? {};
  const danhSachLoai = loaiData?.data ?? [];
  const danhSachChuyen = ctData?.data ?? [];

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
          <option value="dalenken">Xuất cảng</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có container nào" />
      <Pagination meta={meta} onChange={setTrang} />

      {/* ── Modal đăng ký ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Đăng ký container mới" width={520}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {serverErr}
            </div>
          )}

          {/* Số container */}
          <div style={{ marginBottom: 12 }}>
            <Input
              label="Số container"
              placeholder="VD: MSCU1234567"
              error={errors.socontainer?.message}
              {...register('socontainer', {
                required: 'Số container là bắt buộc.',
                pattern: {
                  value: /^[A-Z]{4}[0-9]{7}$/,
                  message: 'Định dạng: 4 chữ hoa + 7 số (VD: MSCU1234567)',
                },
                onChange: (e) => { e.target.value = e.target.value.toUpperCase().replace(/\s/g, ''); },
              })}
            />
          </div>

          {/* Loại hình */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Loại hình <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'nhap', l: 'Nhập khẩu' }, { v: 'xuat', l: 'Xuất khẩu' }].map(({ v, l }) => {
                const checked = watch('loai_hinh') === v;
                return (
                  <label key={v} style={{
                    flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px',
                    border: `2px solid ${checked ? '#0d6efd' : '#e2e8f0'}`,
                    borderRadius: 8, cursor: 'pointer',
                    background: checked ? '#eff6ff' : '#fff',
                    fontSize: 14, fontWeight: checked ? 600 : 400,
                  }}>
                    <input type="radio" value={v} {...register('loai_hinh')} style={{ accentColor: '#0d6efd' }} />
                    {l}
                  </label>
                );
              })}
            </div>
          </div>

          {/* Loại container */}
          <div style={{ marginBottom: 12 }}>
            <LoaiContainerSelect
              loaiList={danhSachLoai}
              value={maloaiChon}
              onChange={setMaloaiChon}
              error={serverErr && !maloaiChon ? 'Vui lòng chọn loại container.' : ''}
            />
          </div>

          {/* Chuyến tàu (bắt buộc) */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Chuyến tàu <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select style={selectStyle(errors.machuyentau)} {...register('machuyentau', { required: 'Vui lòng chọn chuyến tàu.' })}>
              <option value="">— Chọn chuyến tàu —</option>
              {danhSachChuyen.map(ct => (
                <option key={ct.machuyentau} value={ct.machuyentau}>
                  {ct.sovoyage} — {ct.tentau}
                </option>
              ))}
            </select>
            {errors.machuyentau && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.machuyentau.message}</p>}
          </div>

          {/* Số niêm chì + Trọng lượng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input
              label="Số niêm chì"
              required
              placeholder="VD: ML12345"
              error={errors.soniemchi?.message}
              {...register('soniemchi', { required: 'Vui lòng nhập số niêm chì.' })}
            />
            <Input
              label="Trọng lượng (kg)"
              type="number"
              placeholder="VD: 12000"
              {...register('trongluong_kg', { min: { value: 0, message: 'Phải ≥ 0.' } })}
            />
          </div>

          {/* Mô tả hàng hóa */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Mô tả hàng hóa
            </label>
            <textarea
              rows={2}
              placeholder="Hàng hóa bên trong container…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              {...register('mota_hanghoa')}
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
