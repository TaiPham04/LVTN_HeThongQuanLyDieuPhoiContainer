import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import {
  usePhieuLayHangKHList, useContainerTrongBaiKH, useCreatePhieuLayHangKH, useHuyPhieuLayHangKH,
  usePhieuLayHangKHDetail,
} from '@/hooks/khachhang/usePhieuLayHangKH';
import { useTaiXeKHList } from '@/hooks/khachhang/useTaiXeKH';

const trangThaiBadge = (v) => {
  const map = {
    cho_lay:  { label: 'Chờ lấy',  variant: 'warning' },
    da_lay:   { label: 'Đã lấy',   variant: 'success' },
    huy:      { label: 'Đã hủy',   variant: 'danger'  },
    het_han:  { label: 'Hết hạn',  variant: 'gray'    },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

const selectStyle = (hasErr) => ({
  width: '100%', padding: '8px 12px',
  border: `1px solid ${hasErr ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
});

function PhieuDetailModal({ maphieu, onClose }) {
  const { data, isLoading } = usePhieuLayHangKHDetail(maphieu);
  const p = data?.data;

  if (isLoading) return <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>Đang tải…</div>;
  if (!p) return null;

  return (
    <div style={{ fontSize: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px', marginBottom: 16 }}>
        {[
          ['Số container',   <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.socontainer}</span>],
          ['Trạng thái',     trangThaiBadge(p.trangthai)],
          ['Biển số xe',     p.biensoxe || '—'],
          ['Biển số rơ-moóc', p.bienso_romo || '—'],
          ['Tài xế',         p.hoten_taixe || '—'],
          ['Khung giờ ETA',  (p.eta_tu && p.eta_den) ? `${p.eta_tu} – ${p.eta_den}` : '—'],
          ['Xuất phiếu',     p.thoigian_xuat || '—'],
          ['Hết hạn',        p.thoigian_het_han || '—'],
        ].map(([label, val]) => (
          <div key={label}>
            <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase' }}>{label}</div>
            <div>{val}</div>
          </div>
        ))}
      </div>

      {p.vitri_snapshot && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          <strong>Vị trí khi xuất phiếu:</strong> Block {p.vitri_snapshot.tenblock} · Khoảng {p.vitri_snapshot.khoang} · Hàng {p.vitri_snapshot.hang} · Tầng {p.vitri_snapshot.tang}
        </div>
      )}

      {p.ma_qr && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', fontFamily: 'monospace', fontSize: 13, marginBottom: 12 }}>
          <strong>Mã QR:</strong> {p.ma_qr}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
      </div>
    </div>
  );
}

const defValues = { macontainer: '', mataixe: '', biensoxe: '', bienso_romo: '', eta_tu: '', eta_den: '', ghichu: '' };

export default function PhieuLayHangKHPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]       = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [huyRow, setHuyRow]           = useState(null);
  const [detailId, setDetailId]       = useState(null);
  const [serverErr, setServerErr]     = useState('');
  const [successMsg, setSuccessMsg]   = useState('');

  const { data, isLoading }      = usePhieuLayHangKHList({ trang, search, trangthai: filterTT });
  const { data: contData }       = useContainerTrongBaiKH();
  const { data: taixeData }      = useTaiXeKHList();
  const createMut                = useCreatePhieuLayHangKH();
  const huyMut                   = useHuyPhieuLayHangKH();

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues: defValues });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const openThem = () => {
    reset(defValues);
    setServerErr('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      const res = await createMut.mutateAsync({
        ...values,
        macontainer: Number(values.macontainer),
        mataixe: values.mataixe ? Number(values.mataixe) : undefined,
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
      const res = await huyMut.mutateAsync(huyRow.maphieu);
      showSuccess(res.message);
    } catch (e) {
      alert(e?.response?.data?.message || 'Không thể hủy.');
    } finally {
      setHuyRow(null);
    }
  };

  const columns = [
    {
      key: 'socontainer',
      label: 'Container',
      render: (v) => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'biensoxe',
      label: 'Biển số xe',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'hoten_taixe',
      label: 'Tài xế',
      render: (v) => <span style={{ fontSize: 13 }}>{v || '—'}</span>,
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'thoigian_xuat',
      label: 'Xuất phiếu',
      render: (v) => <span style={{ fontSize: 12 }}>{v || '—'}</span>,
    },
    {
      key: 'thoigian_het_han',
      label: 'Hết hạn',
      render: (v) => <span style={{ fontSize: 12, color: '#f59e0b' }}>{v || '—'}</span>,
    },
    {
      key: 'actions',
      label: '',
      align: 'center',
      width: 130,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="ghost" onClick={() => setDetailId(row.maphieu)}>Chi tiết</Button>
          {row.trangthai === 'cho_lay' && (
            <Button size="sm" variant="danger" onClick={() => setHuyRow(row)}>Hủy</Button>
          )}
        </div>
      ),
    },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};
  const contList = contData?.data ?? [];
  const taixeList = taixeData?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Phiếu lấy hàng"
        description="Tạo và quản lý phiếu lấy hàng D/O"
        action={
          <Button onClick={openThem} disabled={contList.length === 0} title={contList.length === 0 ? 'Không có container đủ điều kiện' : ''}>
            + Tạo phiếu
          </Button>
        }
      />

      {successMsg && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {contList.length === 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13 }}>
          Không có container đủ điều kiện tạo phiếu (cần trạng thái <strong>trong bãi</strong> và đã thông quan <strong>luồng xanh</strong>).
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
            <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}>Xóa lọc</Button>
          )}
        </form>
        <select
          value={filterTT}
          onChange={e => { setFilterTT(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="cho_lay">Chờ lấy</option>
          <option value="da_lay">Đã lấy</option>
          <option value="huy">Đã hủy</option>
          <option value="het_han">Hết hạn</option>
        </select>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có phiếu lấy hàng nào" />
      <Pagination meta={meta} onChange={setTrang} />

      {/* ── Modal tạo phiếu ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Tạo phiếu lấy hàng" width={460}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {serverErr}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Container <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select style={selectStyle(!!errors.macontainer)} {...register('macontainer', { required: 'Bắt buộc.' })}>
              <option value="">— Chọn container —</option>
              {contList.map(c => (
                <option key={c.macontainer} value={c.macontainer}>
                  {c.socontainer} · {c.tenloai}
                </option>
              ))}
            </select>
            {errors.macontainer && <span style={{ fontSize: 12, color: '#ef4444' }}>{errors.macontainer.message}</span>}
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Tài xế (không bắt buộc)
            </label>
            <select
              style={selectStyle(false)}
              {...register('mataixe')}
              onChange={(e) => {
                const val = e.target.value;
                setValue('mataixe', val);
                const driver = taixeList.find(tx => String(tx.mataixe) === val);
                setValue('biensoxe', driver?.biensoxe || '');
              }}
            >
              <option value="">— Không chọn —</option>
              {taixeList.map(tx => (
                <option key={tx.mataixe} value={tx.mataixe}>
                  {tx.hoten} — {tx.sodienthoai}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Input
              label="Biển số xe (không bắt buộc)"
              placeholder="VD: 51C-12345"
              {...register('biensoxe')}
            />
          </div>

          <div style={{ marginBottom: 12 }}>
            <Input
              label="Biển số rơ-moóc (không bắt buộc)"
              placeholder="VD: 51R-67890"
              {...register('bienso_romo')}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                ETA từ
              </label>
              <input
                type="datetime-local"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                {...register('eta_tu')}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
                ETA đến
              </label>
              <input
                type="datetime-local"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                {...register('eta_den')}
              />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Ghi chú
            </label>
            <textarea
              rows={2}
              placeholder="Ghi chú thêm nếu có…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              {...register('ghichu')}
            />
          </div>

          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#92400e', marginBottom: 16 }}>
            Phiếu có hiệu lực trong <strong>24 giờ</strong> kể từ khi tạo. Mang phiếu (mã QR) đến cổng để lấy container.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Đang tạo…' : 'Tạo phiếu'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal chi tiết ── */}
      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Chi tiết phiếu lấy hàng" width={500}>
        {detailId && <PhieuDetailModal maphieu={detailId} onClose={() => setDetailId(null)} />}
      </Modal>

      {/* ── Modal xác nhận hủy ── */}
      <Modal
        open={!!huyRow}
        onClose={() => setHuyRow(null)}
        title="Xác nhận hủy phiếu"
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
            Hủy phiếu lấy hàng cho container{' '}
            <strong style={{ fontFamily: 'monospace' }}>{huyRow.socontainer}</strong>?
          </div>
        )}
      </Modal>
    </div>
  );
}
