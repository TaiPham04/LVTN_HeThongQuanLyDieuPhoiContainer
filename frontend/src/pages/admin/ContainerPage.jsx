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
import { useContainerList, useThemContainer, useCapNhatContainer, useXoaContainer } from '@/hooks/useContainer';
import { useLoaiContainerList } from '@/hooks/useLoaiContainer';
import { useHangTauList } from '@/hooks/useHangTau';
import { useChuyenTauList } from '@/hooks/useChuyenTau';

/* ── helpers ── */
const trangThaiBadge = (v) => {
  const map = {
    dangky:         { label: 'Đăng ký',    variant: 'info' },
    trongbai:       { label: 'Trong bãi',  variant: 'success' },
    xuatcong:       { label: 'Xuất cổng',  variant: 'warning' },
    dalenken:       { label: 'Đã lên kẹn', variant: 'gray' },
    khonghoatdong:  { label: 'Vô hiệu',    variant: 'danger' },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const haiquanBadge = (v) => {
  const map = {
    choxuly:     { label: 'Chờ xử lý',   variant: 'warning' },
    dathongguan: { label: 'Thông quan',   variant: 'success' },
    biugiu:      { label: 'Bị giữ',       variant: 'danger' },
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

  const { data, isLoading }     = useContainerList({ trang, search, trangthai: filterTT, mahangtau: filterHT, per_page: 15 });
  const { data: loaiData }      = useLoaiContainerList({ per_page: 100 });
  const { data: htData }        = useHangTauList({ per_page: 100 });
  const { data: ctData }        = useChuyenTauList({ per_page: 100 });
  const them    = useThemContainer();
  const capNhat = useCapNhatContainer();
  const xoa     = useXoaContainer();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  /* ── columns ── */
  const columns = [
    { key: 'socontainer', label: 'Số container', width: 130 },
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
      key: 'mahangtau',
      label: 'Hãng tàu',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.mascac}</div>
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
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'trangthai_haiquan',
      label: 'Hải quan',
      align: 'center',
      render: (v) => haiquanBadge(v),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 170,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => setDetailRow(row)}>Chi tiết</Button>
          <Button size="sm" variant="ghost"
            onClick={() => openSua(row)}
            disabled={['trongbai', 'khonghoatdong'].includes(row.trangthai)}
          >Sửa</Button>
          <Button size="sm" variant="danger"
            onClick={() => setDeleteRow(row)}
            disabled={['trongbai', 'khonghoatdong'].includes(row.trangthai)}
          >Xóa</Button>
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
      socontainer:   row.socontainer,
      maloai:        String(row.maloai),
      mahangtau:     String(row.mahangtau),
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
    const payload = {
      ...values,
      maloai:        parseInt(values.maloai),
      mahangtau:     parseInt(values.mahangtau),
      machuyentau:   values.machuyentau ? parseInt(values.machuyentau) : null,
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
        action={<Button onClick={openThem}>+ Đăng ký container</Button>}
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
          <option value="dalenken">Đã lên kẹn</option>
          <option value="khonghoatdong">Vô hiệu</option>
        </select>
      </div>

      {/* Bảng */}
      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có container nào" />

      {/* Phân trang */}
      {meta.last_page > 1 && (
        <Pagination current={meta.current_page} total={meta.last_page} onChange={setTrang} />
      )}

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

          {/* Loại container + Hãng tàu */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Loại container <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select style={selectStyle(errors.maloai)} {...register('maloai', { required: 'Vui lòng chọn loại.' })}>
                <option value="">— Chọn loại —</option>
                {danhSachLoai.map(lc => (
                  <option key={lc.maloai} value={lc.maloai}>{lc.maiso} — {lc.tenloai}</option>
                ))}
              </select>
              {errors.maloai && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.maloai.message}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Hãng tàu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select style={selectStyle(errors.mahangtau)} {...register('mahangtau', { required: 'Vui lòng chọn hãng tàu.' })}>
                <option value="">— Chọn hãng tàu —</option>
                {danhSachHangTau.map(ht => (
                  <option key={ht.mahangtau} value={ht.mahangtau}>{ht.mascac} — {ht.tenhangtau}</option>
                ))}
              </select>
              {errors.mahangtau && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.mahangtau.message}</p>}
            </div>
          </div>

          {/* Chuyến tàu */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Chuyến tàu <span style={{ color: '#6b7280', fontWeight: 400 }}>(không bắt buộc)</span>
            </label>
            <select style={selectStyle(false)} {...register('machuyentau')}>
              <option value="">— Chưa gán chuyến —</option>
              {danhSachChuyen.map(ct => (
                <option key={ct.machuyentau} value={ct.machuyentau}>
                  {ct.sovoyage} — {ct.tentau}
                </option>
              ))}
            </select>
          </div>

          {/* Số niêm chì + Trọng lượng */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Số niêm chì"
              placeholder="VD: SL123456"
              error={errors.soniemchi?.message}
              {...register('soniemchi', { maxLength: { value: 50, message: 'Tối đa 50 ký tự' } })}
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
              ['Trạng thái',     trangThaiBadge(detailRow.trangthai)],
              ['Hải quan',       haiquanBadge(detailRow.trangthai_haiquan)],
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
