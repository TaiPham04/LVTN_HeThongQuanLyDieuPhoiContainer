import { useRef, useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import { useScanQR, useVaoCong, useXacNhanDaLay } from '@/hooks/nhanvien/usePhieuLayHang';

const fmtViTri = (v) => {
  if (!v?.tenblock) return '—';
  return `${v.tenblock} — K${v.khoang} / H${v.hang} / T${v.tang}`;
};

const STATUS = {
  cho_lay: {
    label: 'HỢP LỆ',
    bg: '#d1fae5', color: '#065f46', border: '#6ee7b7',
  },
  da_lay: {
    label: 'ĐÃ LẤY HÀNG',
    bg: '#dbeafe', color: '#1e40af', border: '#93c5fd',
  },
  het_han: {
    label: 'HẾT HẠN',
    bg: '#fee2e2', color: '#991b1b', border: '#fca5a5',
  },
  huy: {
    label: 'ĐÃ HỦY',
    bg: '#f1f5f9', color: '#475569', border: '#cbd5e1',
  },
};

export default function ScanQRPage() {
  const [qrInput, setQrInput]       = useState('');
  const [phieu, setPhieu]           = useState(null);
  const [notFound, setNotFound]     = useState(false);
  const [romo, setRomo]             = useState('');
  const [actionErr, setActionErr]   = useState('');
  const [actionOk, setActionOk]     = useState('');
  const inputRef                    = useRef(null);

  const scanMut    = useScanQR();
  const vaoCongMut = useVaoCong();
  const xacNhanMut = useXacNhanDaLay();

  const handleScan = async (e) => {
    e?.preventDefault();
    const code = qrInput.trim().toUpperCase();
    if (!code) return;

    setPhieu(null);
    setNotFound(false);
    setActionErr('');
    setActionOk('');

    try {
      const res = await scanMut.mutateAsync(code);
      setPhieu(res.data);
      setRomo(res.data.bienso_romo || '');
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true);
      else setActionErr(err?.response?.data?.message || 'Lỗi kết nối.');
    }
  };

  const handleVaoCong = async () => {
    setActionErr('');
    setActionOk('');
    try {
      const res = await vaoCongMut.mutateAsync({ maphieu: phieu.maphieu, bienso_romo: romo || undefined });
      setPhieu(res.data);
      setActionOk(res.message);
    } catch (err) {
      setActionErr(err?.response?.data?.message || 'Đã có lỗi.');
    }
  };

  const handleXacNhan = async () => {
    setActionErr('');
    setActionOk('');
    try {
      await xacNhanMut.mutateAsync(phieu.maphieu);
      setActionOk('Xác nhận lấy hàng thành công. Container đã xuất cổng.');
      setPhieu(prev => ({ ...prev, trangthai: 'da_lay' }));
    } catch (err) {
      setActionErr(err?.response?.data?.message || 'Đã có lỗi.');
    }
  };

  const st = phieu ? (STATUS[phieu.trangthai] ?? STATUS.huy) : null;
  const isChoLay    = phieu?.trangthai === 'cho_lay';
  const daVaoCong   = !!phieu?.thoigian_vao_cong;
  const missingInfo = isChoLay && (!phieu?.mataixe || !phieu?.biensoxe);

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageHeader title="Quét mã QR cổng" description="Nhập hoặc quét mã QR để tra cứu phiếu lấy hàng" />

      {/* ── Ô nhập QR ── */}
      <form onSubmit={handleScan} style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <input
          ref={inputRef}
          value={qrInput}
          onChange={e => setQrInput(e.target.value.toUpperCase())}
          placeholder="Nhập hoặc quét mã QR…"
          autoFocus
          style={{
            flex: 1, padding: '10px 14px', fontSize: 15, letterSpacing: 1,
            border: '2px solid #e2e8f0', borderRadius: 10, outline: 'none',
            fontFamily: 'monospace', background: '#fff',
          }}
        />
        <Button type="submit" disabled={scanMut.isPending || !qrInput.trim()}>
          {scanMut.isPending ? 'Đang tìm…' : 'Tra cứu'}
        </Button>
      </form>

      {/* ── Không tìm thấy ── */}
      {notFound && (
        <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 10, padding: '14px 18px', color: '#991b1b', fontWeight: 600, textAlign: 'center' }}>
          <i className="ti ti-x-circle" style={{ marginRight: 8 }} />
          Không tìm thấy phiếu với mã QR này.
        </div>
      )}

      {/* ── Kết quả ── */}
      {phieu && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 14, overflow: 'hidden' }}>

          {/* Status banner */}
          <div style={{ background: st.bg, border: `0 0 1px 0`, borderBottom: `1.5px solid ${st.border}`, padding: '18px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: st.color, letterSpacing: '.05em' }}>
              {st.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, fontFamily: 'monospace', color: '#0f172a', marginTop: 4 }}>
              {phieu.socontainer}
            </div>
            {isChoLay && phieu.thoigian_het_han && (
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                <i className="ti ti-clock" style={{ marginRight: 4 }} />Hết hạn: {phieu.thoigian_het_han}
              </div>
            )}
          </div>

          <div style={{ padding: '18px 24px' }}>
            {/* Cảnh báo thiếu thông tin */}
            {missingInfo && (
              <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#92400e', marginBottom: 14 }}>
                <i className="ti ti-alert-triangle" style={{ marginRight: 6 }} />
                Phiếu chưa có thông tin tài xế / biển số đầu kéo. Khách hàng cần cập nhật trước.
              </div>
            )}

            {/* Timeline Gate-in / Gate-out */}
            {isChoLay && (
              <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                {[
                  { label: 'Vào cổng',  done: daVaoCong,  time: phieu.thoigian_vao_cong },
                  { label: 'Lấy hàng', done: !!phieu.thoigian_lay, time: phieu.thoigian_lay },
                ].map((step, i) => (
                  <div key={i} style={{ flex: 1, padding: '10px 14px', background: step.done ? '#f0fdf4' : '#fafafa', borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none', textAlign: 'center' }}>
                    <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', color: step.done ? '#16a34a' : '#94a3b8' }}>
                      {step.done ? '✓ ' : ''}{step.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{step.time || '—'}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Thông tin chi tiết */}
            {[
              ['Tài xế',        phieu.hoten_taixe || '—'],
              ['Điện thoại',    phieu.sdt_taixe   || '—'],
              ['Biển số đầu kéo', phieu.biensoxe  || '—'],
              ['Vị trí bãi',   fmtViTri(phieu.vitri_snapshot)],
              ['Hãng tàu',     phieu.mascac || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>{k}</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{v}</span>
              </div>
            ))}

            {/* Rơ-moóc — editable nếu cho_lay và chưa vào cổng */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
              <span style={{ color: '#64748b' }}>Biển số rơ-moóc</span>
              {isChoLay && !daVaoCong ? (
                <input
                  value={romo}
                  onChange={e => setRomo(e.target.value.toUpperCase())}
                  placeholder="Nhập nếu khác phiếu"
                  style={{
                    padding: '4px 8px', border: '1.5px solid #cbd5e1', borderRadius: 6,
                    fontSize: 13, width: 140, textAlign: 'right', fontFamily: 'monospace',
                    outline: 'none',
                  }}
                />
              ) : (
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{phieu.bienso_romo || '—'}</span>
              )}
            </div>

            {/* ETA */}
            {(phieu.eta_tu || phieu.eta_den) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Khung giờ ETA</span>
                <span style={{ fontWeight: 600 }}>{phieu.eta_tu} – {phieu.eta_den}</span>
              </div>
            )}

            {/* Action messages */}
            {actionErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginTop: 14 }}>
                <i className="ti ti-alert-circle" style={{ marginRight: 6 }} />{actionErr}
              </div>
            )}
            {actionOk && (
              <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#065f46', marginTop: 14 }}>
                <i className="ti ti-circle-check" style={{ marginRight: 6 }} />{actionOk}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ marginTop: 18 }}>
              {isChoLay && !daVaoCong && !missingInfo && (
                <button
                  onClick={handleVaoCong}
                  disabled={vaoCongMut.isPending}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                    background: '#0d9488', color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <i className="ti ti-door-enter" />
                  {vaoCongMut.isPending ? 'Đang ghi nhận…' : 'Cho vào cổng (Gate-in)'}
                </button>
              )}

              {isChoLay && daVaoCong && (
                <button
                  onClick={handleXacNhan}
                  disabled={xacNhanMut.isPending}
                  style={{
                    width: '100%', padding: '13px 0', borderRadius: 10, border: 'none',
                    background: '#16a34a', color: '#fff', fontSize: 15, fontWeight: 700,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  <i className="ti ti-circle-check" />
                  {xacNhanMut.isPending ? 'Đang xác nhận…' : 'Xác nhận lấy hàng (Gate-out)'}
                </button>
              )}
            </div>

            {/* Nút tra cứu lại */}
            <div style={{ textAlign: 'center', marginTop: 12 }}>
              <button
                onClick={() => { setPhieu(null); setQrInput(''); setActionErr(''); setActionOk(''); inputRef.current?.focus(); }}
                style={{ background: 'none', border: 'none', color: '#64748b', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}>
                Quét mã khác
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
