import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { usePhieuLayHangTX, useDenCangTX, useLayHangTX } from '@/hooks/taixe/usePhieuLayHangTX';

const TRANGTHAI = {
  cho_lay: { label: 'Chờ lấy hàng', variant: 'warning' },
  da_lay:  { label: 'Đã lấy',        variant: 'success' },
  het_han: { label: 'Hết hạn',       variant: 'danger'  },
  huy:     { label: 'Đã hủy',        variant: 'gray'    },
};

const fmtViTri = (p) => {
  if (!p?.tenblock) return '—';
  return `${p.tenblock} / Ô ${p.maobai_code} (K${p.khoang}-H${p.hang}-T${p.tang})`;
};

const MILESTONES = [
  { key: 'thoigian_xuat',     label: 'Phát phiếu',   icon: 'ti-file-text',   color: '#6366f1' },
  { key: 'thoigian_den_cang', label: 'Đến cảng',     icon: 'ti-map-pin',     color: '#0d9488' },
  { key: 'thoigian_lay',      label: 'Lấy hàng',     icon: 'ti-circle-check',color: '#16a34a' },
];

export default function PhieuLayHangPage() {
  const [filterTT, setFilterTT] = useState('');
  const [selected, setSelected] = useState(null);
  const [actionErr, setActionErr] = useState('');

  const { data, isLoading } = usePhieuLayHangTX(filterTT);
  const denCangMut = useDenCangTX();
  const layHangMut = useLayHangTX();

  const list  = data?.data  ?? [];
  const taixe = data?.taixe ?? {};

  const tt = TRANGTHAI[selected?.trangthai] ?? { label: selected?.trangthai, variant: 'gray' };
  const isChoLay    = selected?.trangthai === 'cho_lay';
  const daDenCang   = !!selected?.thoigian_den_cang;

  const handleDenCang = async () => {
    setActionErr('');
    try {
      await denCangMut.mutateAsync(selected.maphieu);
      setSelected(prev => ({ ...prev, thoigian_den_cang: '...' }));
    } catch (e) {
      setActionErr(e?.response?.data?.message || 'Đã có lỗi.');
    }
  };

  const handleLayHang = async () => {
    setActionErr('');
    try {
      await layHangMut.mutateAsync(selected.maphieu);
      setSelected(null);
    } catch (e) {
      setActionErr(e?.response?.data?.message || 'Đã có lỗi.');
    }
  };

  return (
    <div>
      {/* ── Header info tài xế ── */}
      {taixe.hoten && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ width: 44, height: 44, background: '#ccfbf1', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ti ti-user" style={{ fontSize: 20, color: '#0d9488' }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{taixe.hoten}</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
              <i className="ti ti-phone" style={{ marginRight: 4 }} />{taixe.sodienthoai}
              {taixe.biensoxe && <>&nbsp;·&nbsp;<i className="ti ti-car" style={{ marginRight: 4 }} />{taixe.biensoxe}</>}
            </div>
          </div>
        </div>
      )}

      {/* ── Bộ lọc ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { v: '',        l: 'Tất cả'       },
          { v: 'cho_lay', l: 'Chờ lấy hàng' },
          { v: 'da_lay',  l: 'Đã lấy'       },
          { v: 'het_han', l: 'Hết hạn'      },
        ].map(({ v, l }) => (
          <button key={v} onClick={() => setFilterTT(v)}
            style={{
              padding: '7px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
              border: `1.5px solid ${filterTT === v ? '#0d9488' : '#e2e8f0'}`,
              background: filterTT === v ? '#ccfbf1' : '#fff',
              color: filterTT === v ? '#0d9488' : '#64748b',
              fontWeight: filterTT === v ? 600 : 400,
            }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── Danh sách phiếu ── */}
      {isLoading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8' }}>Đang tải...</div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#94a3b8', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
          <i className="ti ti-ticket-off" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
          Không có phiếu lấy hàng nào.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map(p => {
            const badge    = TRANGTHAI[p.trangthai] ?? { label: p.trangthai, variant: 'gray' };
            const isActive = p.trangthai === 'cho_lay';
            return (
              <div key={p.maphieu} onClick={() => { setSelected(p); setActionErr(''); }}
                style={{
                  background: '#fff', borderRadius: 12, padding: '14px 18px',
                  border: `1.5px solid ${isActive ? '#5eead4' : '#e2e8f0'}`,
                  cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center',
                  boxShadow: isActive ? '0 2px 8px rgba(13,148,136,0.08)' : 'none',
                  transition: 'box-shadow .15s',
                }}>
                <div style={{ width: 42, height: 42, borderRadius: 10, background: isActive ? '#ccfbf1' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ti ti-package" style={{ fontSize: 20, color: isActive ? '#0d9488' : '#94a3b8' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.socontainer}</span>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                    {p.thoigian_den_cang && !p.thoigian_lay && (
                      <Badge variant="info">Đã đến cảng</Badge>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>
                    {p.mascac} &nbsp;·&nbsp; {p.biensoxe || 'Chưa có biển số'}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    Phiếu: {p.thoigian_xuat}
                    {p.thoigian_het_han && <>&nbsp;·&nbsp;HH: {p.thoigian_het_han}</>}
                  </div>
                </div>
                <i className="ti ti-chevron-right" style={{ color: '#cbd5e1', fontSize: 18, flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal chi tiết + QR ── */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `Phiếu — ${selected.socontainer}` : ''}
        width={440}
        footer={<Button variant="secondary" onClick={() => setSelected(null)}>Đóng</Button>}
      >
        {selected && (
          <div>
            {/* QR code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <div style={{
                padding: 16, background: '#fff', border: '2px solid #e2e8f0',
                borderRadius: 12, display: 'inline-block',
                opacity: isChoLay ? 1 : 0.35,
              }}>
                <QRCodeSVG value={selected.ma_qr} size={160} level="M" />
              </div>
              <div style={{ marginTop: 8, fontFamily: 'monospace', fontSize: 12, color: '#64748b', letterSpacing: 1 }}>
                {selected.ma_qr}
              </div>
              {!isChoLay && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Phiếu không còn hiệu lực</div>
              )}
              {isChoLay && selected.thoigian_het_han && (
                <div style={{ marginTop: 6, fontSize: 12, color: '#0d9488' }}>
                  <i className="ti ti-clock" style={{ marginRight: 4 }} />Hết hạn: {selected.thoigian_het_han}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14 }}>
              <Badge variant={tt.variant}>{tt.label}</Badge>
            </div>

            {/* ── Timeline mốc thời gian ── */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                Tiến trình
              </div>
              <div style={{ position: 'relative' }}>
                {MILESTONES.map((m, i) => {
                  const time  = selected[m.key];
                  const done  = !!time;
                  const isLast = i === MILESTONES.length - 1;
                  return (
                    <div key={m.key} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
                      {/* Dot + line */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 28 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: done ? m.color : '#e2e8f0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background .2s',
                        }}>
                          <i className={`ti ${m.icon}`} style={{ fontSize: 13, color: done ? '#fff' : '#94a3b8' }} />
                        </div>
                        {!isLast && (
                          <div style={{ width: 2, height: 28, background: done ? m.color : '#e2e8f0', marginTop: 2, opacity: 0.5 }} />
                        )}
                      </div>
                      {/* Label + time */}
                      <div style={{ paddingBottom: isLast ? 0 : 20, paddingTop: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: done ? '#0f172a' : '#94a3b8' }}>{m.label}</div>
                        <div style={{ fontSize: 11, color: done ? '#64748b' : '#cbd5e1', marginTop: 2 }}>
                          {done ? (time === '...' ? 'Vừa ghi nhận' : time) : 'Chưa thực hiện'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ── Thông tin container ── */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 14 }}>
              {[
                ['Số container',     selected.socontainer],
                ['Hãng tàu',         selected.mascac],
                ['Vị trí lấy',       fmtViTri(selected.vitri_snapshot)],
                ['Biển số xe',       selected.biensoxe || '—'],
                ['Biển số rơ-moóc',  selected.bienso_romo || '—'],
                ['Khung giờ ETA',    (selected.eta_tu && selected.eta_den) ? `${selected.eta_tu} – ${selected.eta_den}` : '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#0f172a', textAlign: 'right', maxWidth: 220 }}>{v}</span>
                </div>
              ))}
            </div>

            {selected.ghichu && (
              <div style={{ marginBottom: 14, padding: '8px 12px', background: '#fffbeb', borderRadius: 8, fontSize: 12, color: '#92400e', border: '1px solid #fde68a' }}>
                <i className="ti ti-notes" style={{ marginRight: 5 }} />{selected.ghichu}
              </div>
            )}

            {/* ── Action buttons ── */}
            {isChoLay && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 14 }}>
                {actionErr && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#dc2626', marginBottom: 10 }}>
                    {actionErr}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 10 }}>
                  {!daDenCang && (
                    <button
                      onClick={handleDenCang}
                      disabled={denCangMut.isPending}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, border: '1.5px solid #0d9488',
                        background: '#ccfbf1', color: '#0d9488', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <i className="ti ti-map-pin" />
                      {denCangMut.isPending ? 'Đang ghi...' : 'Đã đến cảng'}
                    </button>
                  )}
                  {daDenCang && (
                    <button
                      onClick={handleLayHang}
                      disabled={layHangMut.isPending}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
                        background: '#16a34a', color: '#fff', fontWeight: 600, fontSize: 13,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                      }}>
                      <i className="ti ti-circle-check" />
                      {layHangMut.isPending ? 'Đang xác nhận...' : 'Xác nhận lấy hàng'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
