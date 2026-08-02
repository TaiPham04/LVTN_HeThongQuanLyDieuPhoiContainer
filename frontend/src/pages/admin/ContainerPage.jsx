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
import LoaiContainerSelect from '@/components/shared/LoaiContainerSelect';
import { useContainerList, useThemContainer, useCapNhatContainer, useXoaContainer } from '@/hooks/admin/useContainer';
import useAuthStore from '@/store/authStore';
import { useLoaiContainerList } from '@/hooks/admin/useLoaiContainer';
import { useHangTauList } from '@/hooks/admin/useHangTau';
import { useChuyenTauList } from '@/hooks/admin/useChuyenTau';

/* ── helpers ── */
const trangThaiBadge = (v, row) => {
  const map = {
    dangky:         { label: 'Đăng ký',    variant: 'info' },
    trongbai:       { label: 'Trong bãi',  variant: 'success' },
    // Container xuất rời bãi qua cổng thì gọi là "Xuất cảng" — "Xuất cổng" chỉ dùng
    // cho container nhập được tài xế kéo ra sau khi nhân viên cổng xác nhận.
    xuatcong:       { label: row?.loai_hinh === 'xuat' ? 'Xuất cảng' : 'Xuất cổng', variant: 'warning' },
    dalenken:       { label: 'Xuất cảng',  variant: 'warning' },
    khonghoatdong:  { label: 'Vô hiệu',    variant: 'danger' },
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
  loai_hinh: 'xuat',
  machuyentau: '',
  soniemchi: '',
  trongluong_kg: '',
  mota_hanghoa: '',
};

export default function ContainerPage() {
  const [trang, setTrang]               = useState(1);
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [filterTT, setFilterTT]         = useState('');
  const [filterHT, setFilterHT]         = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [detailRow, setDetailRow]       = useState(null);
  const [editRow, setEditRow]           = useState(null);
  const [deleteRow, setDeleteRow]       = useState(null);
  const [serverErr, setServerErr]       = useState('');
  const [maloaiChon, setMaloaiChon]     = useState('');

  const { isAdmin, isNhanVienBai } = useAuthStore();
  const { data, isLoading }     = useContainerList({ trang, search, trangthai: filterTT, mahangtau: filterHT, per_page: 15 });
  const { data: loaiData }      = useLoaiContainerList({ per_page: 100 });
  const { data: htData }        = useHangTauList({ per_page: 100 });
  const { data: ctData }        = useChuyenTauList({ per_page: 100 });
  const them       = useThemContainer();
  const capNhat    = useCapNhatContainer();
  const xoa        = useXoaContainer();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  /* ── columns ── */
  const loaiHinhBadge = (v) => (
    <Badge variant={v === 'nhap' ? 'info' : 'warning'}>{v === 'nhap' ? 'Nhập khẩu' : 'Xuất khẩu'}</Badge>
  );

  const columns = [
    { key: 'socontainer', label: 'Số container', width: 130 },
    {
      key: 'loai_hinh',
      label: 'Loại hình',
      align: 'center',
      render: (v) => loaiHinhBadge(v),
    },
    {
      key: 'maloai',
      label: 'Loại container',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.maiso}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tenloai}</div>
        </div>
      ),
    },
    {
      key: 'mascac',
      label: 'Hãng tàu',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.mascac || '—'}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tenhangtau}</div>
        </div>
      ),
    },
    {
      key: 'machuyentau',
      label: 'Chuyến tàu',
      render: (_, row) => row.sovoyage
        ? <span style={{ fontSize: 13 }}>{row.sovoyage}</span>
        : <span style={{ color: '#cbd5e1' }}>—</span>,
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
      render: (v, row) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'center' }}>
          {haiquanBadge(v)}
          {thongQuanBadge(row.da_thong_quan)}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 140,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => setDetailRow(row)}>Chi tiết</Button>
          {isAdmin() && <>
            <Button size="sm" variant="ghost"
              onClick={() => openSua(row)}
              disabled={['trongbai', 'khonghoatdong'].includes(row.trangthai)}
            >Sửa</Button>
            <Button size="sm" variant="danger"
              onClick={() => setDeleteRow(row)}
              disabled={['trongbai', 'khonghoatdong'].includes(row.trangthai)}
            >Xóa</Button>
          </>}
        </div>
      ),
    },
  ];

  /* ── mở modal ── */
  const openThem = () => {
    setEditRow(null);
    reset(defaultValues);
    setMaloaiChon('');
    setServerErr('');
    setModalOpen(true);
  };

  const openSua = (row) => {
    setEditRow(row);
    setMaloaiChon(row.maloai || '');
    reset({
      socontainer:   row.socontainer,
      loai_hinh:     row.loai_hinh || 'xuat',
      machuyentau:   row.machuyentau ? String(row.machuyentau) : '',
      soniemchi:     row.soniemchi ?? '',
      trongluong_kg: row.trongluong_kg ?? '',
      mota_hanghoa:  row.mota_hanghoa ?? '',
    });
    setServerErr('');
    setModalOpen(true);
  };

  /* ── submit ── */
  const onSubmit = async (values) => {
    setServerErr('');
    if (!maloaiChon) { setServerErr('Vui lòng chọn loại và kích thước container.'); return; }
    const payload = {
      ...values,
      maloai:        parseInt(maloaiChon),
      machuyentau:   parseInt(values.machuyentau),
      trongluong_kg: values.trongluong_kg ? parseFloat(values.trongluong_kg) : null,
    };
    try {
      if (editRow) {
        await capNhat.mutateAsync({ macontainer: editRow.macontainer, ...payload });
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

  /* ── xóa ── */
  const handleXoa = async ({ lydo, xacNhan }) => {
    try {
      await xoa.mutateAsync({
        macontainer: deleteRow.macontainer,
        lydo_xoa:    lydo,
        xacnhan_xoa: xacNhan,
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

  const list            = data?.data ?? [];
  const meta            = data?.meta ?? {};
  const danhSachLoai    = loaiData?.data ?? [];
  const danhSachHangTau = htData?.data ?? [];
  const danhSachChuyen  = ctData?.data ?? [];

  /* ─────────── RENDER ─────────── */
  return (
    <div>
      <PageHeader
        title="Quản lý container"
        description="Đăng ký và quản lý thông tin container"
        action={!isNhanVienBai() && <Button onClick={openThem}>+ Đăng ký container</Button>}
      />

      {/* Thanh tìm kiếm + lọc */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo số container…"
            style={{
              flex: 1, maxWidth: 280, padding: '8px 12px',
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
          value={filterHT}
          onChange={e => { setFilterHT(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả hãng tàu</option>
          {danhSachHangTau.map(ht => (
            <option key={ht.mahangtau} value={ht.mahangtau}>{ht.mascac} — {ht.tenhangtau}</option>
          ))}
        </select>

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
          <option value="khonghoatdong">Vô hiệu</option>
        </select>
      </div>

      {/* Bảng */}
      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có container nào" />

      {/* Phân trang */}
      <Pagination meta={meta} onChange={setTrang} />

      {/* ── Modal Thêm / Sửa ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? `Sửa container — ${editRow.socontainer}` : 'Đăng ký container mới'}
        width={560}
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

          {/* Số container */}
          <div style={{ marginBottom: 12 }}>
            <Input
              label="Số container"
              placeholder="VD: MSCU1234567"
              disabled={!!editRow}
              error={errors.socontainer?.message}
              {...register('socontainer', {
                required: 'Vui lòng nhập số container.',
                pattern: {
                  value: /^[A-Z]{4}[0-9]{7}$/,
                  message: 'Định dạng: 4 chữ hoa + 7 số (VD: MSCU1234567)',
                },
                onChange: (e) => {
                  e.target.value = e.target.value.toUpperCase();
                },
              })}
            />
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

          {/* Loại hình nhập/xuất */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Loại hình <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'xuat', l: 'Xuất khẩu' }, { v: 'nhap', l: 'Nhập khẩu' }].map(({ v, l }) => {
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Số niêm chì"
              required
              placeholder="VD: SL123456"
              error={errors.soniemchi?.message}
              {...register('soniemchi', {
                required: 'Vui lòng nhập số niêm chì.',
                maxLength: { value: 50, message: 'Tối đa 50 ký tự' },
              })}
            />
            <Input
              label="Trọng lượng (kg)"
              type="number"
              step="0.01"
              min={0}
              placeholder="VD: 18500"
              error={errors.trongluong_kg?.message}
              {...register('trongluong_kg')}
            />
          </div>

          {/* Mô tả hàng hóa */}
          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Mô tả hàng hóa
            </label>
            <textarea
              placeholder="Mô tả hàng hóa bên trong container…"
              rows={3}
              style={{
                width: '100%', padding: '8px 12px',
                border: '1px solid #e2e8f0', borderRadius: 8,
                fontSize: 14, outline: 'none', resize: 'vertical',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              {...register('mota_hanghoa', { maxLength: { value: 1000, message: 'Tối đa 1000 ký tự' } })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : editRow ? 'Cập nhật' : 'Đăng ký'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Chi tiết ── */}
      {detailRow && (
        <Modal
          open={!!detailRow}
          onClose={() => setDetailRow(null)}
          title={`Chi tiết — ${detailRow.socontainer}`}
          width={520}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
            {[
              ['Số container',   detailRow.socontainer],
              ['Loại',           `${detailRow.maiso} — ${detailRow.tenloai}`],
              ['Hãng tàu',       `${detailRow.mascac} — ${detailRow.tenhangtau}`],
              ['Chuyến tàu',     detailRow.sovoyage || '—'],
              ['Số niêm chì',    detailRow.soniemchi || '—'],
              ['Trọng lượng',    detailRow.trongluong_kg ? `${detailRow.trongluong_kg} kg` : '—'],
              ['Trạng thái',     trangThaiBadge(detailRow.trangthai, detailRow)],
              ['Hải quan',       haiquanBadge(detailRow.trangthai_haiquan)],
              ['Thông quan',     thongQuanBadge(detailRow.da_thong_quan)],
              ['Ngày vào bãi',   detailRow.thoigian_vaobai || '—'],
              ['Ngày ra bãi',    detailRow.thoigian_rabai || '—'],
              ['Bị hỏng',        detailRow.bi_hong ? '⚠️ Có' : 'Không'],
              ['Đăng ký lúc',    detailRow.created_at],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 500 }}>{value}</div>
              </div>
            ))}
            {detailRow.mota_hanghoa && (
              <div style={{ gridColumn: '1 / -1' }}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>Mô tả hàng hóa</div>
                <div style={{ fontWeight: 500 }}>{detailRow.mota_hanghoa}</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setDetailRow(null)}>Đóng</Button>
          </div>
        </Modal>
      )}

      {/* ── Modal Xóa ── */}
      {deleteRow && (
        <ConfirmDelete
          open={!!deleteRow}
          onClose={() => setDeleteRow(null)}
          onConfirm={handleXoa}
          identifier={deleteRow.socontainer}
          tenHienThi={`container ${deleteRow.socontainer}`}
          loading={xoa.isPending}
        />
      )}
    </div>
  );
}
