import { useState } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/ui/Badge';
import { useSoDoBai, useSoDoBaiList } from '@/hooks/useSoDoBai';

/* ── Màu ô bãi ────────────────────────────────────────────────── */
const CELL = {
  trong:           { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  dangsudung:      { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  dangsudung_hong: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  khonghoatdong:   { bg: '#f3f4f6', border: '#d1d5db', text: '#9ca3af' },
};

function cellTheme(o) {
  if (o.trangthai === 'khonghoatdong') return CELL.khonghoatdong;
  if (o.trangthai === 'dangsudung' && o.container?.bi_hong) return CELL.dangsudung_hong;
  if (o.trangthai === 'dangsudung') return CELL.dangsudung;
  return CELL.trong;
}

/* ── Badge hải quan ────────────────────────────────────────────── */
function HaiQuanBadge({ v }) {
  const map = {
    dathongguan: ['success', 'Đã thông quan'],
    dangxuly:    ['info',    'Đang xử lý'],
    choxuly:     ['gray',    'Chờ xử lý'],
    tuchoi:      ['danger',  'Từ chối'],
  };
  const [variant, label] = map[v] ?? ['gray', v];
  return <Badge variant={variant}>{label}</Badge>;
}

/* ── Dòng popup ─────────────────────────────────────────────────── */
function PopupRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#6b7280', fontSize: 12, flexShrink: 0 }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: 13 }}>{value}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function SoDoBaiPage() {
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedTang, setSelectedTang]   = useState(1);
  const [popup, setPopup]                 = useState(null); // { obai, top, left }

  const { data: listData }           = useSoDoBaiList();
  const { data: sodoBai, isLoading } = useSoDoBai(selectedBlock);

  const blockList = listData?.data ?? [];
  const block     = sodoBai?.block;
  const obaiList  = sodoBai?.obai ?? [];

  /* ── Build lookup grid[tang][hang][khoang] ── */
  const grid = {};
  for (const o of obaiList) {
    (grid[o.tang]         ??= {});
    (grid[o.tang][o.hang] ??= {});
    grid[o.tang][o.hang][o.khoang] = o;
  }

  const tangList   = block ? Array.from({ length: block.sotang   }, (_, i) => i + 1) : [];
  const hangList   = block ? Array.from({ length: block.sohang   }, (_, i) => i + 1) : [];
  const khoangList = block ? Array.from({ length: block.sokhoang }, (_, i) => i + 1) : [];

  const obaiInTier = obaiList.filter(o => o.tang === selectedTang);
  const soTrong    = obaiInTier.filter(o => o.trangthai === 'trong').length;
  const soDung     = obaiInTier.filter(o => o.trangthai === 'dangsudung').length;

  /* ── Xử lý click ô ── */
  const handleCellClick = (o, e) => {
    if (o.trangthai !== 'dangsudung' || !o.container) return;
    e.stopPropagation();
    const rect  = e.currentTarget.getBoundingClientRect();
    const popW  = 248;
    const popH  = 200;
    const left  = rect.right + 10 + popW > window.innerWidth ? rect.left - popW - 4 : rect.right + 8;
    const top   = Math.min(rect.top, window.innerHeight - popH - 8);
    setPopup({ obai: o, top, left });
  };

  /* ─────────── RENDER ─────────── */
  return (
    <div onClick={() => setPopup(null)}>
      <PageHeader
        title="Sơ đồ bãi"
        description="Trực quan hóa vị trí container trong từng khu vực bãi"
      />

      {/* ── Chọn Block ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Khu vực bãi:</label>
        <select
          value={selectedBlock}
          onChange={e => { setSelectedBlock(e.target.value); setSelectedTang(1); setPopup(null); }}
          style={{
            padding: '8px 12px', border: '1px solid #e2e8f0',
            borderRadius: 8, fontSize: 14, background: '#fff',
            minWidth: 210, outline: 'none', cursor: 'pointer',
          }}
        >
          <option value="">— Chọn khu vực bãi —</option>
          {blockList.map(b => (
            <option key={b.makhuvuc} value={b.makhuvuc}>
              Block {b.tenblock}{b.lablock_lanh ? ' ❄' : ''}
              {' '}({b.sokhoang}×{b.sohang}×{b.sotang})
            </option>
          ))}
        </select>

        {block && (
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {block.sokhoang} Bay × {block.sohang} Hàng × {block.sotang} Tầng
            &nbsp;·&nbsp;
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{soTrong} trống</span>
            &nbsp;·&nbsp;
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{soDung} đang dùng</span>
            {block.lablock_lanh && (
              <span style={{ marginLeft: 10, color: '#0ea5e9', fontWeight: 600 }}>❄ Block lạnh</span>
            )}
          </span>
        )}
      </div>

      {/* ── Placeholder chưa chọn ── */}
      {!selectedBlock && (
        <div style={{
          textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14,
          background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0',
        }}>
          Vui lòng chọn khu vực bãi để xem sơ đồ
        </div>
      )}

      {selectedBlock && isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280', fontSize: 14 }}>
          Đang tải sơ đồ…
        </div>
      )}

      {block && !isLoading && (
        <>
          {/* ── Tab tầng ── */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0', marginBottom: 16 }}>
            {tangList.map(t => {
              const dung   = obaiList.filter(o => o.tang === t && o.trangthai === 'dangsudung').length;
              const active = selectedTang === t;
              return (
                <button
                  key={t}
                  onClick={() => { setSelectedTang(t); setPopup(null); }}
                  style={{
                    padding: '8px 20px', fontSize: 13, fontWeight: 600,
                    border: 'none', cursor: 'pointer',
                    borderRadius: '8px 8px 0 0',
                    background: active ? '#2563eb' : '#f1f5f9',
                    color: active ? '#fff' : '#374151',
                    borderBottom: active ? '2px solid #2563eb' : '2px solid transparent',
                    marginBottom: -2,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  Tầng {t}
                  {dung > 0 && (
                    <span style={{
                      background: active ? 'rgba(255,255,255,0.3)' : '#2563eb',
                      color: '#fff', borderRadius: 10, fontSize: 10,
                      padding: '1px 6px', fontWeight: 700,
                    }}>
                      {dung}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Legend ── */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
            {[
              { bg: '#dcfce7', border: '#86efac', label: 'Trống' },
              { bg: '#dbeafe', border: '#93c5fd', label: 'Có container' },
              { bg: '#fee2e2', border: '#fca5a5', label: 'Container hỏng' },
              { bg: '#f3f4f6', border: '#d1d5db', label: 'Vô hiệu hóa' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{
                  width: 14, height: 14, borderRadius: 3,
                  background: l.bg, border: `1px solid ${l.border}`,
                }} />
                <span style={{ color: '#6b7280' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* ── Grid ── */}
          <div style={{
            overflowX: 'auto',
            background: '#fff', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '20px 20px 20px 8px',
          }}>
            {/* Bay header */}
            <div style={{ display: 'flex', paddingLeft: 44, marginBottom: 4 }}>
              {khoangList.map(k => (
                <div key={k} style={{
                  width: 60, textAlign: 'center', fontSize: 11,
                  color: '#9ca3af', fontWeight: 600, flexShrink: 0,
                }}>
                  Bay {k}
                </div>
              ))}
            </div>

            {/* Rows */}
            {hangList.map(h => (
              <div key={h} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                {/* Nhãn hàng */}
                <div style={{
                  width: 44, fontSize: 11, color: '#9ca3af', fontWeight: 600,
                  flexShrink: 0, textAlign: 'right', paddingRight: 8,
                }}>
                  H{h}
                </div>

                {/* Ô bãi */}
                {khoangList.map(k => {
                  const o = grid[selectedTang]?.[h]?.[k];

                  if (!o) {
                    return (
                      <div key={k} style={{
                        width: 60, height: 48, margin: '0 1px', borderRadius: 6,
                        background: '#f8fafc', border: '1px dashed #e2e8f0', flexShrink: 0,
                      }} />
                    );
                  }

                  const th = cellTheme(o);
                  return (
                    <div
                      key={k}
                      onClick={e => handleCellClick(o, e)}
                      onMouseEnter={e => {
                        if (o.trangthai === 'dangsudung')
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
                      }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                      title={o.maobai_code}
                      style={{
                        width: 60, height: 48, margin: '0 1px', borderRadius: 6,
                        border: `1px solid ${th.border}`, background: th.bg,
                        flexShrink: 0, display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        cursor: o.trangthai === 'dangsudung' ? 'pointer' : 'default',
                        opacity: o.trangthai === 'khonghoatdong' ? 0.4 : 1,
                        userSelect: 'none', transition: 'box-shadow 0.15s',
                      }}
                    >
                      {o.trangthai === 'dangsudung' && o.container && (
                        <>
                          <div style={{ fontSize: 10, fontWeight: 700, color: th.text }}>
                            {o.container.socontainer.slice(0, 4)}
                          </div>
                          <div style={{ fontSize: 9, color: th.text, opacity: 0.8 }}>
                            {o.container.socontainer.slice(4, 7)}
                          </div>
                        </>
                      )}
                      {o.trangthai === 'khonghoatdong' && (
                        <span style={{ fontSize: 14, color: th.text }}>✕</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── Popup thông tin container ── */}
      {popup && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', top: popup.top, left: popup.left,
            width: 248, background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
            padding: '14px 16px', zIndex: 1000,
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 12,
          }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
              {popup.obai.maobai_code}
            </span>
            <span
              onClick={() => setPopup(null)}
              style={{ cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1 }}
            >
              ×
            </span>
          </div>

          {popup.obai.container && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <PopupRow
                label="Số container"
                value={<span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{popup.obai.container.socontainer}</span>}
              />
              <PopupRow
                label="Hải quan"
                value={<HaiQuanBadge v={popup.obai.container.trangthai_haiquan} />}
              />
              <PopupRow
                label="Tình trạng"
                value={
                  popup.obai.container.bi_hong
                    ? <Badge variant="danger">Bị hỏng</Badge>
                    : <Badge variant="success">Bình thường</Badge>
                }
              />
              {popup.obai.container.thoigian_vaobai && (
                <PopupRow label="Vào bãi" value={popup.obai.container.thoigian_vaobai} />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
