import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { useBienBanKTList, useLuuBienBan } from '@/hooks/admin/useBienBanKT';

/* ── helpers ── */
const LOAI_LABEL = {
  nhapbai:  'Nhập bãi',
  xuatbai:  'Xuất bãi',
  thamdinh: 'Thẩm định',
  haiquan:  'Hải quan',
};

const loaiBadge = (v) => {
  const map = {
    nhapbai:  'success',
    xuatbai:  'warning',
    thamdinh: 'info',
    haiquan:  'secondary',
  };
  return <Badge variant={map[v] || 'gray'}>{LOAI_LABEL[v] || v}</Badge>;
};

const ketluanBadge = (v) => {
  const map = {
    datieu:   { label: 'Đạt tiêu chuẩn', variant: 'success' },
    khongdat: { label: 'Không đạt',       variant: 'danger'  },
    tamgiu:   { label: 'Tạm giữ',         variant: 'warning' },
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
  loaiktd:     'nhapbai',
  ketqua_ktd:  '',
  bi_hong:     false,
  ketluan:     'datieu',
  thoigian_ktd: new Date().toISOString().slice(0, 16),
};

export default function BienBanKTPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterLoai, setFilterLoai]   = useState('');
  const [filterKL, setFilterKL]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [detailRow, setDetailRow]     = useState(null);
  const [serverErr, setServerErr]     = useState('');

  const { data, isLoading } = useBienBanKTList({ trang, search, loaiktd: filterLoai, ketluan: filterKL });
  const luuBienBan          = useLuuBienBan();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  const openThem = () => {
    reset({ ...defaultValues, thoigian_ktd: new Date().toISOString().slice(0, 16) });
    setServerErr('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      await luuBienBan.mutateAsync({
        ...values,
        socontainer: values.socontainer.toUpperCase(),
        bi_hong: !!values.bi_hong,
      });
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi xảy ra.'));
    }
  };

  /* ── columns ── */
  const columns = [
    {
      key: 'socontainer',
      label: 'Container',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.socontainer}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.mascac} {row.tenhangtau}</div>
        </div>
      ),
    },
    {
      key: 'loaiktd',
      label: 'Loại kiểm tra',
      align: 'center',
      render: (v) => loaiBadge(v),
    },
    {
      key: 'ketqua_ktd',
      label: 'Kết quả',
      render: (v) => (
        <span style={{ fontSize: 13, color: '#374151' }}>
          {v?.length > 70 ? v.slice(0, 70) + '…' : v}
        </span>
      ),
    },
    {
      key: 'bi_hong',
      label: 'Hư hỏng',
      align: 'center',
      render: (v) => v
        ? <Badge variant="danger">Có hư hỏng</Badge>
        : <Badge variant="success">Không</Badge>,
    },
    {
      key: 'ketluan',
      label: 'Kết luận',
      align: 'center',
      render: (v) => ketluanBadge(v),
    },
    {
      key: 'thoigian_ktd',
      label: 'Thời gian KTĐ',
      render: (v) => <span style={{ fontSize: 13 }}>{v}</span>,
    },
    {
      key: 'hoten_nhanvien',
      label: 'Nhân viên',
      render: (v) => <span style={{ fontSize: 13 }}>{v}</span>,
    },
    {
      key: 'actions',
      label: 'Chi tiết',
      align: 'center',
      width: 90,
      render: (_, row) => (
        <Button size="sm" variant="secondary" onClick={() => setDetailRow(row)}>Xem</Button>
      ),
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Biên bản kiểm tra định kỳ"
        description="Lập và tra cứu biên bản kiểm tra container"
        action={<Button onClick={openThem}>+ Tạo biên bản</Button>}
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
          value={filterLoai}
          onChange={e => { setFilterLoai(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả loại</option>
          <option value="nhapbai">Nhập bãi</option>
          <option value="xuatbai">Xuất bãi</option>
          <option value="thamdinh">Thẩm định</option>
          <option value="haiquan">Hải quan</option>
        </select>

        <select
          value={filterKL}
          onChange={e => { setFilterKL(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả kết luận</option>
          <option value="datieu">Đạt tiêu chuẩn</option>
          <option value="khongdat">Không đạt</option>
          <option value="tamgiu">Tạm giữ</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có biên bản nào" />

      <Pagination
        meta={{ trang_hien: meta.current_page, tong_trang: meta.last_page, tong: meta.total, per_page: meta.per_page }}
        onChange={setTrang}
      />

      {/* ── Modal tạo biên bản ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tạo biên bản kiểm tra" width={500}>
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
                onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
              })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Loại kiểm tra <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select style={selectStyle(errors.loaiktd)} {...register('loaiktd', { required: true })}>
                <option value="nhapbai">Nhập bãi</option>
                <option value="xuatbai">Xuất bãi</option>
                <option value="thamdinh">Thẩm định</option>
                <option value="haiquan">Hải quan</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                Kết luận <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select style={selectStyle(errors.ketluan)} {...register('ketluan', { required: true })}>
                <option value="datieu">Đạt tiêu chuẩn</option>
                <option value="khongdat">Không đạt</option>
                <option value="tamgiu">Tạm giữ</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Thời gian kiểm tra <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="datetime-local"
              style={selectStyle(errors.thoigian_ktd)}
              {...register('thoigian_ktd', { required: 'Thời gian là bắt buộc.' })}
            />
            {errors.thoigian_ktd && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.thoigian_ktd.message}</p>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Kết quả kiểm tra <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Mô tả chi tiết kết quả kiểm tra container…"
              style={{
                width: '100%', padding: '8px 12px',
                border: `1px solid ${errors.ketqua_ktd ? '#ef4444' : '#e2e8f0'}`,
                borderRadius: 8, fontSize: 14, outline: 'none',
                resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              {...register('ketqua_ktd', { required: 'Kết quả kiểm tra là bắt buộc.' })}
            />
            {errors.ketqua_ktd && (
              <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.ketqua_ktd.message}</p>
            )}
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
              <input type="checkbox" {...register('bi_hong')} style={{ width: 16, height: 16 }} />
              Container có hư hỏng vật lý
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : 'Lưu biên bản'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal chi tiết ── */}
      {detailRow && (
        <Modal
          open={!!detailRow}
          onClose={() => setDetailRow(null)}
          title={`Biên bản — ${detailRow.socontainer}`}
          width={480}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 14 }}>
            {[
              ['Số container',   detailRow.socontainer],
              ['Hãng tàu',       `${detailRow.mascac || ''} ${detailRow.tenhangtau || ''}`],
              ['Loại kiểm tra',  loaiBadge(detailRow.loaiktd)],
              ['Kết luận',       ketluanBadge(detailRow.ketluan)],
              ['Hư hỏng',        detailRow.bi_hong ? <Badge variant="danger">Có hư hỏng</Badge> : <Badge variant="success">Không</Badge>],
              ['Thời gian KTĐ',  detailRow.thoigian_ktd],
              ['Nhân viên',      detailRow.hoten_nhanvien],
              ['Lập lúc',        detailRow.created_at],
            ].map(([label, value]) => (
              <div key={label}>
                <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
                <div style={{ fontWeight: 500 }}>{value}</div>
              </div>
            ))}
            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>Kết quả kiểm tra</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, background: '#f8fafc', padding: '10px 12px', borderRadius: 6, border: '1px solid #e2e8f0' }}>
                {detailRow.ketqua_ktd}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <Button variant="secondary" onClick={() => setDetailRow(null)}>Đóng</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
