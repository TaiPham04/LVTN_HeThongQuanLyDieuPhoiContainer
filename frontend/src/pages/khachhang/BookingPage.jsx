import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import Toast from '@/components/ui/Toast';
import LoaiContainerSelect from '@/components/shared/LoaiContainerSelect';
import {
  useBookingKHList, useLichTauKH, useLoaiContainerKH,
  useCreateBooking, useHuyBooking, traCuuLoaiContainer,
} from '@/hooks/khachhang/useBookingKH';

const trangThaiBadge = (v, row) => {
  const map = {
    dangky:   { label: 'Đăng ký',   variant: 'info' },
    trongbai: { label: 'Trong bãi', variant: 'success' },
    // Container xuất rời bãi qua cổng thì gọi là "Xuất cảng" — "Xuất cổng" chỉ dùng
    // cho container nhập được tài xế kéo ra sau khi nhân viên cổng xác nhận.
    xuatcong: { label: row?.loai_hinh === 'xuat' ? 'Xuất cảng' : 'Xuất cổng', variant: 'warning' },
    dalenken: { label: 'Xuất cảng', variant: 'warning' },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const selectStyle = (hasErr) => ({
  width: '100%', padding: '8px 12px',
  border: `1px solid ${hasErr ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
});

const defValues = {
  socontainer: '',
  maloai: '',
  machuyentau: '',
  soniemchi: '',
  trongluong_kg: '',
  mota_hanghoa: '',
  ghichu: '',
};

export default function BookingKHPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [huyRow, setHuyRow]           = useState(null);
  const [serverErr, setServerErr]     = useState('');
  const [successMsg, setSuccessMsg]   = useState('');
  const [maloaiChon, setMaloaiChon]   = useState('');
  const [toast, setToast]             = useState(null); // { msg, type }
  const [goiYLoai, setGoiYLoai]       = useState(''); // ghi chú "đã tự điền theo lần trước" nếu tìm thấy
  const [dangTraCuu, setDangTraCuu]   = useState(false);

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const { data, isLoading }   = useBookingKHList({ trang, search, trangthai: filterTT });
  const { data: lichTauData } = useLichTauKH();
  const { data: loaiData }    = useLoaiContainerKH();
  const createMut             = useCreateBooking();
  const huyMut                = useHuyBooking();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: defValues });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const openThem = () => {
    reset(defValues);
    setMaloaiChon('');
    setGoiYLoai('');
    setServerErr('');
    setModalOpen(true);
  };

  // Số container này đã từng có trong hệ thống (lượt trước) chưa — nếu có thì tự
  // điền sẵn loại/kích thước, khách chỉ cần đổi lại nếu không đúng.
  const handleSoContainerBlur = async (e) => {
    const sc = e.target.value.toUpperCase().trim();
    if (!sc || maloaiChon) return; // đã chọn tay rồi thì không ghi đè
    setDangTraCuu(true);
    try {
      const res = await traCuuLoaiContainer(sc);
      if (res.data) {
        setMaloaiChon(res.data.maloai);
      }
    } catch {
      // tra cứu thất bại thì bỏ qua lặng lẽ — không chặn khách nhập tiếp
    } finally {
      setDangTraCuu(false);
    }
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      if (!maloaiChon) { setServerErr('Vui lòng chọn loại và kích thước container.'); return; }
      const res = await createMut.mutateAsync({
        ...values,
        maloai: maloaiChon,
        socontainer: values.socontainer.toUpperCase().trim(),
        trongluong_kg: values.trongluong_kg ? Number(values.trongluong_kg) : undefined,
      });
      setModalOpen(false);
      showSuccess(res.message);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi.'));
    }
  };

  const handleHuy = async () => {
    if (!huyRow) return;
    try {
      const res = await huyMut.mutateAsync(huyRow.macontainer);
      showSuccess(res.message);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Không thể hủy.');
    } finally {
      setHuyRow(null);
    }
  };

  const columns = [
    {
      key: 'socontainer',
      label: 'Số container',
      render: (v, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{v}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tenloai}</div>
        </div>
      ),
    },
    {
      key: 'chuyentau',
      label: 'Chuyến tàu',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 500, fontSize: 13 }}>{row.tentau || '—'}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.sovoyage} · {row.mascac}</div>
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
      key: 'created_at',
      label: 'Ngày đăng ký',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 100,
      render: (_, row) =>
        row.trangthai === 'dangky' ? (
          <Button size="sm" variant="danger" onClick={() => setHuyRow(row)}>
            Hủy
          </Button>
        ) : (
          <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
        ),
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};
  const lichTau = lichTauData?.data ?? [];
  const loaiList = loaiData?.data ?? [];

  return (
    <div>
      <PageHeader
        title="E-Booking"
        subtitle="Đăng ký container theo chuyến tàu"
        action={<Button onClick={openThem}>+ Đăng ký mới</Button>}
      />

      {successMsg && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          {successMsg}
        </div>
      )}

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

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có booking nào" />
      <Pagination meta={meta} onChange={setTrang} />

      {/* ── Modal Đăng ký ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Đăng ký container mới" width={500}>
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
                required: 'Bắt buộc.',
                minLength: { value: 11, message: '11 ký tự.' },
                maxLength: { value: 11, message: '11 ký tự.' },
                onChange: (e) => { e.target.value = e.target.value.toUpperCase().replace(/\s/g, ''); },
                onBlur: handleSoContainerBlur,
              })}
            />
            {dangTraCuu && (
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Đang tra cứu…</p>
            )}
            {!dangTraCuu && goiYLoai && (
              <p style={{ fontSize: 12, color: '#0d9488', marginTop: 4 }}>✓ {goiYLoai}</p>
            )}
          </div>

          <div style={{ marginBottom: 12 }}>
            <LoaiContainerSelect
              loaiList={loaiList}
              value={maloaiChon}
              onChange={setMaloaiChon}
              error={serverErr && !maloaiChon ? 'Bắt buộc.' : ''}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Chuyến tàu <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              style={selectStyle(!!errors.machuyentau)}
              {...register('machuyentau', { required: 'Bắt buộc.' })}
            >
              <option value="">— Chọn chuyến tàu —</option>
              {lichTau.map(ct => (
                <option key={ct.machuyentau} value={ct.machuyentau}>
                  {ct.tentau} · {ct.sovoyage} ({ct.thoigiandukien || 'chưa rõ'})
                </option>
              ))}
            </select>
            {errors.machuyentau && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.machuyentau.message}</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input
              label="Số niêm chì"
              required
              placeholder="VD: ML12345"
              error={errors.soniemchi?.message}
              {...register('soniemchi', {
                required: 'Vui lòng nhập số niêm chì.',
                minLength: { value: 6, message: 'Tối thiểu 6 ký tự.' },
                pattern: { value: /^[A-Z0-9-]+$/, message: 'Chỉ gồm chữ hoa, số và dấu gạch ngang.' },
                onChange: (e) => { e.target.value = e.target.value.toUpperCase().replace(/\s/g, ''); },
              })}
            />
            <Input
              label="Trọng lượng (kg)"
              type="number"
              placeholder="VD: 12000"
              {...register('trongluong_kg', { min: { value: 0, message: 'Phải ≥ 0.' } })}
            />
          </div>

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
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang gửi…' : 'Đăng ký'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Xác nhận hủy ── */}
      <Modal
        open={!!huyRow}
        onClose={() => setHuyRow(null)}
        title="Xác nhận hủy đăng ký"
        width={400}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setHuyRow(null)}>Quay lại</Button>
            <Button variant="danger" onClick={handleHuy} disabled={huyMut.isPending}>
              {huyMut.isPending ? 'Đang hủy…' : 'Xác nhận hủy'}
            </Button>
          </div>
        }
      >
        {huyRow && (
          <div style={{ fontSize: 14, lineHeight: 1.7 }}>
            Bạn có chắc muốn hủy đăng ký container{' '}
            <strong style={{ fontFamily: 'monospace' }}>{huyRow.socontainer}</strong>?
            <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>
              Hành động này không thể hoàn tác.
            </div>
          </div>
        )}
      </Modal>

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
