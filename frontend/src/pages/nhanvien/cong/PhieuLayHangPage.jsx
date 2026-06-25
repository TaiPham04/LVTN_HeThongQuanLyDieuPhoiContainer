import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { QRCodeSVG } from 'qrcode.react';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import {
  usePhieuLayHangList,
  useTaoPhieu,
  useXacNhanDaLay,
  useHuyPhieu,
} from '@/hooks/nhanvien/usePhieuLayHang';
import { useTaiXeListCong } from '@/hooks/nhanvien/useTaiXe';

/* ── helpers ── */
const TRANGTHAI_CONFIG = {
  cho_lay:  { label: 'Chờ lấy hàng', variant: 'warning' },
  da_lay:   { label: 'Đã lấy hàng',  variant: 'success' },
  het_han:  { label: 'Hết hạn',      variant: 'secondary' },
  huy:      { label: 'Đã hủy',       variant: 'danger' },
};

const trangThaiBadge = (v) => {
  const c = TRANGTHAI_CONFIG[v] || { label: v, variant: 'gray' };
  return <Badge variant={c.variant}>{c.label}</Badge>;
};

const vitriText = (p) => {
  if (!p?.tenblock) return '—';
  return `${p.tenblock} — K${p.khoang} / H${p.hang} / T${p.tang}`;
};

/* ── phiếu điện tử dạng có thể in ── */
function PhieuElectronic({ phieu, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Phiếu lấy hàng — ${phieu.socontainer}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #111; }
        .slip { max-width: 420px; margin: auto; border: 2px solid #1a2744; border-radius: 10px; overflow: hidden; }
        .slip-header { background: #1a2744; color: #fff; padding: 14px 20px; display: flex; align-items: center; justify-content: space-between; }
        .slip-logo { font-size: 18px; font-weight: 700; letter-spacing: 1px; }
        .slip-sub { font-size: 11px; opacity: .7; }
        .slip-body { padding: 18px 20px; }
        .slip-title { text-align: center; font-size: 15px; font-weight: 700; color: #1a2744; margin-bottom: 16px; text-transform: uppercase; letter-spacing: .04em; border-bottom: 1px dashed #ccc; padding-bottom: 12px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
        .label { color: #6b7280; }
        .value { font-weight: 600; text-align: right; }
        .vitri-box { background: #f0f4ff; border: 1.5px solid #4f6ef7; border-radius: 8px; padding: 12px 16px; margin: 14px 0; text-align: center; }
        .vitri-label { font-size: 11px; color: #4f6ef7; text-transform: uppercase; letter-spacing: .06em; margin-bottom: 4px; }
        .vitri-value { font-size: 20px; font-weight: 800; color: #1a2744; letter-spacing: .04em; }
        .vitri-code { font-size: 12px; color: #6b7280; margin-top: 3px; }
        .qr-section { text-align: center; margin: 14px 0 8px; }
        .qr-label { font-size: 11px; color: #6b7280; margin-top: 6px; }
        .slip-footer { background: #f8fafc; border-top: 1px solid #e5e7eb; padding: 10px 20px; font-size: 11px; color: #6b7280; text-align: center; }
        @media print { body { padding: 0; } }
      </style></head><body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const v = phieu.vitri_snapshot || {};

  return (
    <Modal open onClose={onClose} title="Phiếu lấy hàng điện tử" width={480}>
      <div ref={printRef}>
        <div style={ps.slip}>
          {/* Header */}
          <div style={ps.header}>
            <div>
              <div style={ps.logo}>LogiCon</div>
              <div style={ps.sub}>Cảng Cát Lái — Phiếu lấy hàng</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: .7, marginBottom: 2 }}>Mã phiếu</div>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>{phieu.ma_qr}</div>
            </div>
          </div>

          <div style={ps.body}>
            <div style={ps.title}>PHIẾU LẤY HÀNG</div>

            {/* Container info */}
            {[
              ['Số container',  phieu.socontainer],
              ['Hãng tàu',      `${phieu.mascac || ''} ${phieu.tenhangtau || ''}`.trim() || '—'],
              ['Niêm chì',      phieu.soniemchi || '—'],
              ['Tài xế',        phieu.hoten_taixe || '—'],
              ['Biển số xe',    phieu.biensoxe || '—'],
            ].map(([label, value]) => (
              <div key={label} style={ps.row}>
                <span style={ps.label}>{label}</span>
                <span style={ps.value}>{value}</span>
              </div>
            ))}

            {/* Vị trí nổi bật */}
            <div style={ps.vitriBox}>
              <div style={ps.vitriLabel}>Vị trí container trong bãi</div>
              <div style={ps.vitriValue}>
                {v.tenblock} &nbsp;—&nbsp; K{v.khoang} / H{v.hang} / T{v.tang}
              </div>
              {v.maobai_code && (
                <div style={ps.vitriCode}>Ô bãi: {v.maobai_code}</div>
              )}
            </div>

            {/* QR Code */}
            <div style={ps.qrSection}>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <QRCodeSVG value={`PLH:${phieu.ma_qr}`} size={130} level="M" />
              </div>
              <div style={ps.qrLabel}>Quét mã để xác nhận tại bãi</div>
            </div>

            {/* Thời gian */}
            {[
              ['Xuất phiếu', phieu.thoigian_xuat],
              ['Hết hạn',    phieu.thoigian_het_han],
              ['Nhân viên',  phieu.hoten_nhanvien],
            ].map(([label, value]) => (
              <div key={label} style={ps.row}>
                <span style={ps.label}>{label}</span>
                <span style={ps.value}>{value}</span>
              </div>
            ))}
          </div>

          <div style={ps.footer}>
            Phiếu có giá trị trong 4 giờ kể từ thời điểm xuất &nbsp;•&nbsp; Cảng Cát Lái, TP. HCM
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
        <Button onClick={handlePrint}>In phiếu</Button>
      </div>
    </Modal>
  );
}

/* ── styles phiếu ── */
const BLUE = '#1a2744';
const ACCENT = '#4f6ef7';

const ps = {
  slip:      { border: `2px solid ${BLUE}`, borderRadius: 10, overflow: 'hidden', fontFamily: 'Arial, sans-serif' },
  header:    { background: BLUE, color: '#fff', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  logo:      { fontSize: 18, fontWeight: 700, letterSpacing: 1 },
  sub:       { fontSize: 11, opacity: .7, marginTop: 2 },
  body:      { padding: '18px 20px' },
  title:     { textAlign: 'center', fontSize: 15, fontWeight: 700, color: BLUE, marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.04em', borderBottom: '1px dashed #ccc', paddingBottom: 12 },
  row:       { display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 },
  label:     { color: '#6b7280' },
  value:     { fontWeight: 600, textAlign: 'right' },
  vitriBox:  { background: '#f0f4ff', border: `1.5px solid ${ACCENT}`, borderRadius: 8, padding: '12px 16px', margin: '14px 0', textAlign: 'center' },
  vitriLabel:{ fontSize: 11, color: ACCENT, textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 },
  vitriValue:{ fontSize: 20, fontWeight: 800, color: BLUE, letterSpacing: '.04em' },
  vitriCode: { fontSize: 12, color: '#6b7280', marginTop: 3 },
  qrSection: { textAlign: 'center', margin: '14px 0 8px' },
  qrLabel:   { fontSize: 11, color: '#6b7280', marginTop: 6 },
  footer:    { background: '#f8fafc', borderTop: '1px solid #e5e7eb', padding: '10px 20px', fontSize: 11, color: '#6b7280', textAlign: 'center' },
};

/* ══════════════════ Main Page ══════════════════ */
export default function PhieuLayHangPage() {
  const [trang, setTrang]           = useState(1);
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterTT, setFilterTT]     = useState('');
  const [ngay, setNgay]             = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [phieuResult, setPhieuResult] = useState(null);
  const [serverErr, setServerErr]   = useState('');

  const { data, isLoading } = usePhieuLayHangList({ trang, search, trangthai: filterTT, ngay });
  const { data: txData }    = useTaiXeListCong();
  const taoPhieu            = useTaoPhieu();
  const xacNhan             = useXacNhanDaLay();
  const huyPhieu            = useHuyPhieu();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { socontainer: '', biensoxe: '', mataixe: '', ghichu: '' },
  });

  const openTao = () => {
    reset({ socontainer: '', biensoxe: '', mataixe: '', ghichu: '' });
    setServerErr('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      const res = await taoPhieu.mutateAsync({
        ...values,
        socontainer: values.socontainer.toUpperCase(),
        mataixe: values.mataixe || null,
      });
      setModalOpen(false);
      setPhieuResult(res.data.data);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs
        ? Object.values(errs).flat().join(' • ')
        : (e?.response?.data?.message || 'Đã có lỗi xảy ra.'));
    }
  };

  const handleXacNhan = async (maphieu) => {
    if (!window.confirm('Xác nhận tài xế đã lấy hàng?')) return;
    await xacNhan.mutateAsync(maphieu);
  };

  const handleHuy = async (maphieu) => {
    if (!window.confirm('Hủy phiếu này?')) return;
    await huyPhieu.mutateAsync(maphieu);
  };

  const taixeOptions = txData?.data ?? [];
  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

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
      key: 'vitri_snapshot',
      label: 'Vị trí',
      render: (v) => (
        <span style={{ fontSize: 13, fontWeight: 500, color: '#1a2744' }}>
          {vitriText(v)}
        </span>
      ),
    },
    {
      key: 'biensoxe',
      label: 'Xe / Tài xế',
      render: (_, row) => (
        <div style={{ fontSize: 12 }}>
          <div>{row.biensoxe || '—'}</div>
          <div style={{ color: '#6b7280' }}>{row.hoten_taixe || ''}</div>
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
      key: 'thoigian_xuat',
      label: 'Xuất phiếu',
      render: (v) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      key: 'thoigian_het_han',
      label: 'Hết hạn',
      render: (v) => <span style={{ fontSize: 12, color: '#ef4444' }}>{v}</span>,
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 160,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="secondary" onClick={() => setPhieuResult(row)}>Xem</Button>
          {row.trangthai === 'cho_lay' && (
            <>
              <Button size="sm" onClick={() => handleXacNhan(row.maphieu)}>Đã lấy</Button>
              <Button size="sm" variant="danger" onClick={() => handleHuy(row.maphieu)}>Hủy</Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Phiếu lấy hàng"
        description="Xuất phiếu vị trí container cho tài xế đến lấy hàng"
        action={<Button onClick={openTao}>+ Xuất phiếu</Button>}
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
            style={{ flex: 1, maxWidth: 260, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <Button type="submit" variant="secondary">Tìm</Button>
          {search && (
            <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}>
              Xóa
            </Button>
          )}
        </form>

        <select
          value={filterTT}
          onChange={e => { setFilterTT(e.target.value); setTrang(1); }}
          style={selectSt}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="cho_lay">Chờ lấy hàng</option>
          <option value="da_lay">Đã lấy hàng</option>
          <option value="het_han">Hết hạn</option>
          <option value="huy">Đã hủy</option>
        </select>

        <input
          type="date"
          value={ngay}
          onChange={e => { setNgay(e.target.value); setTrang(1); }}
          style={selectSt}
        />
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có phiếu nào" />

      <Pagination
        meta={meta}
        onChange={setTrang}
      />

      {/* ── Modal tạo phiếu ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Xuất phiếu lấy hàng" width={460}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
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
              <Input
                label="Biển số xe"
                placeholder="VD: 51C-12345"
                {...register('biensoxe')}
              />
            </div>
            <div>
              <label style={labelSt}>Tài xế</label>
              <select style={selectFull} {...register('mataixe')}>
                <option value="">— Không chọn —</option>
                {taixeOptions.map(tx => (
                  <option key={tx.mataixe} value={tx.mataixe}>
                    {tx.hoten} ({tx.sodienthoai})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 4 }}>
            <label style={labelSt}>Ghi chú</label>
            <textarea
              rows={2}
              placeholder="Thông tin bổ sung (nếu có)…"
              style={{
                width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, outline: 'none', resize: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              {...register('ghichu')}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang xuất…' : 'Xuất phiếu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Hiển thị phiếu điện tử sau khi tạo / xem ── */}
      {phieuResult && (
        <PhieuElectronic phieu={phieuResult} onClose={() => setPhieuResult(null)} />
      )}
    </div>
  );
}

const selectSt = {
  padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff',
};

const labelSt = {
  display: 'block', fontSize: 13, fontWeight: 500,
  color: '#374151', marginBottom: 4,
};

const selectFull = {
  width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0',
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
};
