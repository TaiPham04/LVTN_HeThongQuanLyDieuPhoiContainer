import { useState, useEffect, useRef } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Badge from '@/components/ui/Badge';
import {
  useNVSoDoBai, useNVSoDoBaiList,
  useNVChoGanViTri, useNVGoiYViTri, useNVGoiYDaoChuyen,
  useNVGanViTri, useNVDaoChuyen,
} from '@/hooks/nhanvien/useSoDoBai';

/* ── Màu ô bãi ─────────────────────────────────────────────────── */
const CELL = {
  trong:           { bg: '#dcfce7', border: '#86efac', text: '#166534' },
  dangsudung:      { bg: '#dbeafe', border: '#93c5fd', text: '#1e40af' },
  dangsudung_hong: { bg: '#fee2e2', border: '#fca5a5', text: '#991b1b' },
  khonghoatdong:   { bg: '#f3f4f6', border: '#d1d5db', text: '#9ca3af' },
  goiy_gan:        { bg: '#fef9c3', border: '#eab308', text: '#854d0e' },
  goiy_dao:        { bg: '#d1fae5', border: '#34d399', text: '#065f46' },
  nguon_dao:       { bg: '#fed7aa', border: '#f97316', text: '#7c2d12' },
};

function cellTheme(o, ganSuggest, daoSuggest, daoSource) {
  if (o.trangthai === 'khonghoatdong') return CELL.khonghoatdong;
  if (o.maobai === daoSource)            return CELL.nguon_dao;
  if (daoSuggest.has(o.maobai))          return CELL.goiy_dao;
  if (ganSuggest.has(o.maobai))          return CELL.goiy_gan;
  if (o.trangthai === 'dangsudung' && o.container?.bi_hong) return CELL.dangsudung_hong;
  if (o.trangthai === 'dangsudung')      return CELL.dangsudung;
  return CELL.trong;
}

function HaiQuanBadge({ v }) {
  const map = {
    luong_xanh: ['success', 'Thông quan'],
    luong_vang: ['warning', 'Nghi vấn'],
    luong_do:   ['danger',  'Kiểm hàng'],
  };
  const [variant, label] = map[v] ?? ['gray', v];
  return <Badge variant={variant}>{label}</Badge>;
}

/* ── Tính vị trí popup theo rect của ô được click ─────────────── */
function buildPopupPos(rect) {
  const popW = 260, popH = 340; // đã tăng để chừa chỗ cho khối thông tin chuyến tàu
  const left = rect.right + 10 + popW > window.innerWidth ? rect.left - popW - 4 : rect.right + 8;
  const top  = Math.max(8, Math.min(rect.top, window.innerHeight - popH - 8));
  return { top, left };
}

function PopupRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
      <span style={{ color: '#6b7280', fontSize: 12, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontWeight: 500, fontSize: 13, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

/* ── Nhãn nhóm loại container (đồng bộ với LoaiContainerPage) ──── */
const NHOM_LABEL = {
  dry: 'Khô', reefer: 'Lạnh', open_top: 'Open Top',
  flat_rack: 'Flat Rack', platform: 'Platform', hazmat: 'Nguy hiểm', ventilated: 'Thông gió',
};

/* ── Nhóm danh sách khu vực bãi theo area (luồng ưu tiên) cho dropdown ── */
const AREA_LABEL = { xuat: 'Khu vực Xuất', nhap: 'Khu vực Nhập' };

function groupBlockListTheoArea(blockList) {
  const order = ['xuat', 'nhap'];
  return order
    .map(key => ({ key, label: AREA_LABEL[key], items: blockList.filter(b => b.loai_hinh_uutien === key) }))
    .filter(g => g.items.length > 0);
}

/* ── Nhóm danh sách chờ gán theo block phù hợp ──────────────────── */
function groupChoGanTheoBlock(list) {
  const map = new Map();
  for (const c of list) {
    const key = c.block_phuhop || '';
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(c);
  }
  return [...map.entries()].sort(([a], [b]) => {
    if (!a) return 1;
    if (!b) return -1;
    return a.localeCompare(b);
  });
}

function Toast({ msg, type }) {
  if (!msg) return null;
  const bg = type === 'error' ? '#fef2f2' : '#f0fdf4';
  const cl = type === 'error' ? '#dc2626'  : '#16a34a';
  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: cl, border: `1px solid ${cl}33`,
      borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 2000,
    }}>
      {msg}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════ */
export default function SoDoBaiNVPage() {
  const [selectedBlock, setSelectedBlock] = useState('');
  const [selectedTang, setSelectedTang]   = useState(1);
  const [popup, setPopup]                 = useState(null);
  const [toast, setToast]                 = useState(null);
  const [ganCtx, setGanCtx]               = useState(null);
  const [daoCtx, setDaoCtx]               = useState(null);

  // Ref tới vùng sơ đồ (ô bãi) để auto-scroll khi bắt đầu đảo chuyển
  const gridRef = useRef(null);

  // Nhớ đã auto-nhảy tầng cho lượt chọn (container/ô) nào rồi — tránh nhảy lại
  // khi gợi ý refetch ngầm (sau khi gán/đảo xong, hoặc dữ liệu bãi đổi giữa chừng)
  const lastJumpKeyRef = useRef(null);

  const { data: listData }                      = useNVSoDoBaiList();
  const { data: sodoBai, isLoading }            = useNVSoDoBai(selectedBlock);
  const { data: choGanData, isLoading: loadCG } = useNVChoGanViTri();
  const { data: goiYGan,  isLoading: loadGG }   = useNVGoiYViTri(ganCtx?.macontainer);
  const { data: goiYDao,  isLoading: loadGD }   = useNVGoiYDaoChuyen(daoCtx?.maobai_cu);
  const ganMutation = useNVGanViTri();
  const daoMutation = useNVDaoChuyen();

  const blockList   = listData?.data ?? [];
  const block       = sodoBai?.block;
  const obaiList    = sodoBai?.obai ?? [];
  const choGanList  = choGanData?.data ?? [];

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

  /* ── Mặc định chọn Block A khi vào trang ── */
  useEffect(() => {
    if (selectedBlock || !blockList.length) return;
    const blockA = blockList.find(b => b.tenblock === 'A') ?? blockList[0];
    if (blockA) setSelectedBlock(String(blockA.makhuvuc));
  }, [blockList]); // eslint-disable-line

  /* ── Auto-chuyển block/tầng khi gợi ý load xong — chỉ nhảy 1 lần cho mỗi lượt
     chọn container/ô mới, không nhảy lại khi gợi ý refetch ngầm (vd sau khi
     gán/đảo xong bị invalidateQueries kéo theo) ── */
  useEffect(() => {
    const key = ganCtx ? `gan-${ganCtx.macontainer}` : daoCtx ? `dao-${daoCtx.maobai_cu}` : null;
    if (!key) { lastJumpKeyRef.current = null; return; }
    if (lastJumpKeyRef.current === key) return; // đã nhảy cho lượt chọn này rồi

    const items = ganCtx ? goiYGan?.data : goiYDao?.data;
    if (!items?.length) return;

    lastJumpKeyRef.current = key;
    const top = items[0];
    if (String(top.makhuvuc) !== String(selectedBlock)) {
      setSelectedBlock(String(top.makhuvuc));
      setSelectedTang(top.tang);
    } else if (top.tang !== selectedTang) {
      setSelectedTang(top.tang);
    }
  }, [ganCtx, daoCtx, goiYGan?.data, goiYDao?.data]); // eslint-disable-line

  const ganSuggestSet = new Set((goiYGan?.data ?? []).map(s => s.maobai));
  const daoSuggestSet = new Set((goiYDao?.data ?? []).map(s => s.maobai));
  const daoSourceId   = daoCtx?.maobai_cu ?? null;
  const isInMode      = ganCtx || daoCtx;

  const showToast = (msg, type = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChonGan = (c) => {
    setDaoCtx(null);
    setPopup(null);
    setGanCtx({ macontainer: c.macontainer, socontainer: c.socontainer });
  };

  /* ── Xem chi tiết container đang chờ gán (chuột phải) — không kích hoạt chọn gán ── */
  const handleChoGanRightClick = (c, e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({ choGan: c, ...buildPopupPos(rect), viaRightClick: true });
  };

  const handleCellClick = (o, e) => {
    e.stopPropagation();
    if (ganCtx && o.trangthai === 'trong') {
      if (!ganSuggestSet.has(o.maobai) && ganSuggestSet.size > 0) return;
      confirmGanViTri(o);
      return;
    }
    if (daoCtx && o.trangthai === 'trong') {
      if (!daoSuggestSet.has(o.maobai) && daoSuggestSet.size > 0) return;
      confirmDaoChuyen(o);
      return;
    }
    if (o.trangthai === 'dangsudung' && o.container) {
      const rect = e.currentTarget.getBoundingClientRect();
      setPopup({ obai: o, ...buildPopupPos(rect) });
    }
  };

  /* ── Xem chi tiết container bằng chuột phải — hoạt động cả khi đang ở mode gán/đảo ── */
  const handleCellRightClick = (o, e) => {
    if (o.trangthai !== 'dangsudung' || !o.container) return;
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setPopup({ obai: o, ...buildPopupPos(rect), viaRightClick: true });
  };

  const confirmGanViTri = (obai) => {
    ganMutation.mutate(
      { macontainer: ganCtx.macontainer, maobai: obai.maobai },
      {
        onSuccess: (res) => { showToast(res.message); setGanCtx(null); },
        onError:   (err) => showToast(err.response?.data?.message ?? 'Lỗi gán vị trí', 'error'),
      }
    );
  };

  const handleBatDauDaoChuyen = () => {
    if (!popup) return;
    setDaoCtx({ maobai_cu: popup.obai.maobai, maobai_code: popup.obai.maobai_code, socontainer: popup.obai.container.socontainer });
    setGanCtx(null);
    setPopup(null);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const confirmDaoChuyen = (obaiMoi) => {
    daoMutation.mutate(
      { maobai_cu: daoCtx.maobai_cu, maobai_moi: obaiMoi.maobai },
      {
        onSuccess: (res) => { showToast(res.message); setDaoCtx(null); },
        onError:   (err) => showToast(err.response?.data?.message ?? 'Lỗi đảo chuyển', 'error'),
      }
    );
  };

  const cancelMode = () => { setGanCtx(null); setDaoCtx(null); setPopup(null); };

  return (
    <div onClick={() => { if (!isInMode) setPopup(null); }}>
      <PageHeader
        title="Sơ đồ bãi"
        subtitle="Trực quan hóa và điều phối vị trí container trong bãi"
      />

      {/* ── Chọn Block ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <label style={{ fontSize: 14, fontWeight: 500, color: '#374151' }}>Khu vực bãi:</label>
        <select
          value={selectedBlock}
          onChange={e => { setSelectedBlock(e.target.value); setSelectedTang(1); cancelMode(); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff', minWidth: 210, outline: 'none', cursor: 'pointer' }}
        >
          <option value="">— Chọn khu vực bãi —</option>
          {groupBlockListTheoArea(blockList).map(g => (
            <optgroup key={g.key} label={g.label}>
              {g.items.map(b => (
                <option key={b.makhuvuc} value={b.makhuvuc}>
                  Block {b.tenblock}{b.loai_nhom === 'reefer' ? ' ❄' : ''}
                  {' '}({b.sokhoang}×{b.sohang}×{b.sotang})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        {block && (
          <span style={{ fontSize: 13, color: '#6b7280' }}>
            {block.sokhoang} Bay × {block.sohang} Hàng × {block.sotang} Tầng &nbsp;·&nbsp;
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{soTrong} trống</span>
            &nbsp;·&nbsp;
            <span style={{ color: '#2563eb', fontWeight: 600 }}>{soDung} đang dùng</span>
            {block.loai_nhom === 'reefer' &&<span style={{ marginLeft: 10, color: '#0ea5e9', fontWeight: 600 }}>❄ Block lạnh</span>}
            <span style={{
              marginLeft: 10, fontWeight: 600,
              color: block.loai_hinh_uutien === 'nhap' ? '#0369a1' : '#c2410c',
            }}>
              {block.loai_hinh_uutien === 'nhap' ? '📥 Khu Nhập' : '📤 Khu Xuất'}
            </span>
          </span>
        )}
      </div>

      {/* ── Panel chờ gán (nhóm theo block phù hợp) ── */}
      {choGanList.length > 0 && !daoCtx && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 14 }}>
            Chờ gán vị trí
            <span style={{ marginLeft: 8, background: '#ef4444', color: '#fff', borderRadius: 10, fontSize: 11, padding: '1px 7px', fontWeight: 700 }}>
              {choGanList.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {groupChoGanTheoBlock(choGanList).map(([blockKey, items]) => (
              <div key={blockKey || '_none'}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
                  fontSize: 12, fontWeight: 700, color: blockKey ? '#2563eb' : '#dc2626',
                }}>
                  {blockKey ? `Block ${blockKey}` : 'Chưa có bãi phù hợp'}
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af' }}>({items.length})</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                  {items.map(c => (
                    <div key={c.macontainer}
                      style={{
                        display: 'flex', flexDirection: 'column', gap: 4,
                        border: `2px solid ${ganCtx?.macontainer === c.macontainer ? '#2563eb' : '#e2e8f0'}`,
                        borderRadius: 8, padding: '8px 12px', background: '#f8fafc', cursor: 'pointer',
                      }}
                      onClick={() => handleChonGan(c)}
                      onContextMenu={e => handleChoGanRightClick(c, e)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: 1 }}>{c.socontainer}</span>
                        <span style={{ fontSize: 10, color: '#9ca3af', flexShrink: 0 }}>{NHOM_LABEL[c.nhom] ?? c.nhom ?? '—'}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#6b7280' }}>{c.mascac ?? '—'}{c.sovoyage ? ` · ${c.sovoyage}` : ''}</div>
                      <div style={{ fontSize: 10, color: '#9ca3af', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{c.thoigian_vaobai ?? ''}</span>
                        {ganCtx?.macontainer === c.macontainer && <span style={{ color: '#2563eb', fontWeight: 700 }}>Đang chọn</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Info bar mode — đặt sát ngay trên khối "Gợi ý vị trí" để không bị panel Chờ gán (có thể rất dài) chen vào giữa ── */}
      {(ganCtx || daoCtx) && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: ganCtx ? '#fefce8' : '#fff7ed',
          border: `1px solid ${ganCtx ? '#fde047' : '#fdba74'}`,
          borderRadius: 10, padding: '10px 16px', marginBottom: 16,
        }}>
          <span style={{ fontSize: 13, color: '#374151' }}>
            {ganCtx && <>
              <strong>Gán vị trí:</strong> {ganCtx.socontainer}
              {loadGG ? ' — Đang tải gợi ý…' : ganSuggestSet.size > 0 ? ` — Chọn 1 trong ${ganSuggestSet.size} ô (màu vàng)` : ' — Không có ô trống phù hợp'}
            </>}
            {daoCtx && <>
              <strong>Đảo chuyển:</strong> {daoCtx.socontainer} từ ô {daoCtx.maobai_code}
              {loadGD ? ' — Đang tải gợi ý…' : daoSuggestSet.size > 0 ? ` — Chọn ô đích (màu xanh lá)` : ' — Không tìm được ô phù hợp'}
            </>}
          </span>
          <button onClick={cancelMode} style={{ padding: '4px 14px', fontSize: 12, border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#374151' }}>
            Hủy
          </button>
        </div>
      )}

      {/* ── Gợi ý vị trí ── */}
      {(ganCtx || daoCtx) && (() => {
        const items = ganCtx ? (goiYGan?.data ?? []) : (goiYDao?.data ?? []);
        if (!items.length) return null;
        const isGan = !!ganCtx;
        return (
          <div style={{
            background: isGan ? '#fefce8' : '#f0fdf4',
            border: `1px solid ${isGan ? '#fde047' : '#86efac'}`,
            borderRadius: 10, padding: '12px 16px', marginBottom: 16,
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 8 }}>Top {items.length} vị trí gợi ý:</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {items.map((s, i) => (
                <div key={s.maobai}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${isGan ? '#eab308' : '#34d399'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 13 }}
                  onClick={() => isGan ? confirmGanViTri(s) : confirmDaoChuyen(s)}
                >
                  <span style={{ background: isGan ? '#eab308' : '#34d399', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{i + 1}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>Block {s.tenblock} · {s.maobai_code}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>Tầng {s.tang} · Hàng {s.hang} · Bay {s.khoang}</div>
                  </div>
                  <span style={{ fontSize: 11, color: '#6b7280', marginLeft: 4 }}>
                    {['Phù hợp nhất', 'Phù hợp nhì', 'Phù hợp ba'][i] ?? `Hạng ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {!selectedBlock && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14, background: '#f8fafc', borderRadius: 12, border: '2px dashed #e2e8f0' }}>
          Vui lòng chọn khu vực bãi để xem sơ đồ
        </div>
      )}

      {selectedBlock && isLoading && (
        <div style={{ textAlign: 'center', padding: 60, color: '#6b7280', fontSize: 14 }}>Đang tải sơ đồ…</div>
      )}

      {block && !isLoading && (
        <>
          {/* Tab tầng */}
          <div style={{ display: 'flex', gap: 4, borderBottom: '2px solid #e2e8f0', marginBottom: 16 }}>
            {tangList.map(t => {
              const dung   = obaiList.filter(o => o.tang === t && o.trangthai === 'dangsudung').length;
              const active = selectedTang === t;
              return (
                <button key={t} onClick={() => { setSelectedTang(t); setPopup(null); }}
                  style={{ padding: '8px 20px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', borderRadius: '8px 8px 0 0', background: active ? '#2563eb' : '#f1f5f9', color: active ? '#fff' : '#374151', borderBottom: active ? '2px solid #2563eb' : '2px solid transparent', marginBottom: -2, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Tầng {t}
                  {dung > 0 && <span style={{ background: active ? 'rgba(255,255,255,0.3)' : '#2563eb', color: '#fff', borderRadius: 10, fontSize: 10, padding: '1px 6px', fontWeight: 700 }}>{dung}</span>}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { bg: '#dcfce7', border: '#86efac', label: 'Trống' },
              { bg: '#dbeafe', border: '#93c5fd', label: 'Có container' },
              { bg: '#fee2e2', border: '#fca5a5', label: 'Container hỏng' },
              { bg: '#fef9c3', border: '#eab308', label: 'Gợi ý gán vị trí' },
              { bg: '#d1fae5', border: '#34d399', label: 'Gợi ý đảo chuyển' },
              { bg: '#fed7aa', border: '#f97316', label: 'Nguồn đảo chuyển' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, background: l.bg, border: `1px solid ${l.border}` }} />
                <span style={{ color: '#6b7280' }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Grid */}
          <div ref={gridRef} style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '20px 20px 20px 8px' }}>
            <div style={{ display: 'flex', paddingLeft: 44, marginBottom: 4 }}>
              {khoangList.map(k => (
                <div key={k} style={{ width: 60, textAlign: 'center', fontSize: 11, color: '#9ca3af', fontWeight: 600, flexShrink: 0 }}>Bay {k}</div>
              ))}
            </div>
            {[...hangList].reverse().map(h => (
              <div key={h} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                <div style={{ width: 44, fontSize: 11, color: '#9ca3af', fontWeight: 600, flexShrink: 0, textAlign: 'right', paddingRight: 8 }}>H{h}</div>
                {khoangList.map(k => {
                  const o = grid[selectedTang]?.[h]?.[k];
                  if (!o) return <div key={k} style={{ width: 60, height: 48, margin: '0 1px', borderRadius: 6, background: '#f8fafc', border: '1px dashed #e2e8f0', flexShrink: 0 }} />;

                  const th          = cellTheme(o, ganSuggestSet, daoSuggestSet, daoSourceId);
                  const isHighlight = ganSuggestSet.has(o.maobai) || daoSuggestSet.has(o.maobai) || o.maobai === daoSourceId;
                  const isClickable = (!isInMode && o.trangthai === 'dangsudung') || (ganCtx && o.trangthai === 'trong') || (daoCtx && o.trangthai === 'trong');

                  return (
                    <div key={k} onClick={e => handleCellClick(o, e)}
                      onContextMenu={e => handleCellRightClick(o, e)}
                      onMouseEnter={e => { if (isClickable) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; }}
                      title={o.maobai_code}
                      style={{
                        width: 60, height: 48, margin: '0 1px', borderRadius: 6,
                        border: `${isHighlight ? 2 : 1}px solid ${th.border}`,
                        background: th.bg, flexShrink: 0,
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        cursor: isClickable ? 'pointer' : 'default',
                        opacity: o.trangthai === 'khonghoatdong' ? 0.4 : 1,
                        userSelect: 'none', transition: 'box-shadow 0.15s',
                      }}
                    >
                      {o.trangthai === 'dangsudung' && o.container && (
                        <>
                          <div style={{ fontSize: 10, fontWeight: 700, color: th.text }}>{o.container.socontainer.slice(0, 4)}</div>
                          <div style={{ fontSize: 9, color: th.text, opacity: 0.8 }}>{o.container.socontainer.slice(4, 11)}</div>
                        </>
                      )}
                      {o.trangthai === 'khonghoatdong' && <span style={{ fontSize: 14, color: th.text }}>✕</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Popup thông tin container — luôn hiện nếu mở bằng chuột phải, kể cả đang ở mode gán/đảo */}
      {popup && (!isInMode || popup.viaRightClick) && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'fixed', top: popup.top, left: popup.left, width: 260, background: '#fff',
          border: '1px solid #e2e8f0', borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', padding: '14px 16px', zIndex: 1000,
          maxHeight: 'calc(100vh - 16px)', overflowY: 'auto',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>
              {popup.obai ? popup.obai.maobai_code : popup.choGan.socontainer}
            </span>
            <span onClick={() => setPopup(null)} style={{ cursor: 'pointer', color: '#9ca3af', fontSize: 18, lineHeight: 1 }}>×</span>
          </div>
          {popup.obai?.container && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <PopupRow label="Số container" value={<span style={{ fontFamily: 'monospace', letterSpacing: 1 }}>{popup.obai.container.socontainer}</span>} />
              <PopupRow label="Hải quan"     value={<HaiQuanBadge v={popup.obai.container.trangthai_haiquan} />} />
              <PopupRow label="Tình trạng"   value={popup.obai.container.bi_hong ? <Badge variant="danger">Bị hỏng</Badge> : <Badge variant="success">Bình thường</Badge>} />
              {popup.obai.container.thoigian_vaobai && <PopupRow label="Vào bãi" value={popup.obai.container.thoigian_vaobai} />}
              {popup.obai.container.chuyentau && (
                <>
                  <PopupRow
                    label="Chuyến tàu"
                    value={`${popup.obai.container.chuyentau.tentau ?? '—'} · ${popup.obai.container.chuyentau.sovoyage ?? '—'}`}
                  />
                  <PopupRow
                    label={popup.obai.container.loai_hinh === 'nhap' ? 'Dự kiến cập cảng' : 'Dự kiến rời bến'}
                    value={(popup.obai.container.loai_hinh === 'nhap'
                      ? popup.obai.container.chuyentau.thoigiandukien
                      : popup.obai.container.chuyentau.thoigianroiben) ?? '—'}
                  />
                </>
              )}
              <button onClick={handleBatDauDaoChuyen}
                style={{ marginTop: 6, width: '100%', padding: '7px 0', background: '#f97316', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Đảo chuyển →
              </button>
            </div>
          )}
          {popup.choGan && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <PopupRow label="Loại container" value={popup.choGan.tenloai ?? (NHOM_LABEL[popup.choGan.nhom] ?? popup.choGan.nhom ?? '—')} />
              <PopupRow label="Hải quan"     value={<HaiQuanBadge v={popup.choGan.trangthai_haiquan} />} />
              <PopupRow label="Tình trạng"   value={popup.choGan.bi_hong ? <Badge variant="danger">Bị hỏng</Badge> : <Badge variant="success">Bình thường</Badge>} />
              {popup.choGan.thoigian_vaobai && <PopupRow label="Vào bãi" value={popup.choGan.thoigian_vaobai} />}
              {popup.choGan.sovoyage && (
                <>
                  <PopupRow label="Chuyến tàu" value={`${popup.choGan.tentau ?? '—'} · ${popup.choGan.sovoyage}`} />
                  <PopupRow label="Hãng tàu" value={`${popup.choGan.mascac ?? '—'}${popup.choGan.tenhangtau ? ' · ' + popup.choGan.tenhangtau : ''}`} />
                  <PopupRow
                    label={popup.choGan.loai_hinh === 'nhap' ? 'Dự kiến cập cảng' : 'Dự kiến rời bến'}
                    value={(popup.choGan.loai_hinh === 'nhap' ? popup.choGan.thoigiandukien : popup.choGan.thoigianroiben) ?? '—'}
                  />
                </>
              )}
              <PopupRow label="Block phù hợp" value={popup.choGan.block_phuhop ?? '—'} />
              <button
                onClick={() => { handleChonGan(popup.choGan); setPopup(null); }}
                style={{ marginTop: 6, width: '100%', padding: '7px 0', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Chọn để gán vị trí →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Nút về đầu trang — luôn hiện, làm mờ bớt để không che nội dung ── */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        title="Về đầu trang"
        style={{
          position: 'fixed', bottom: 24, right: 28, zIndex: 1500,
          width: 44, height: 44, borderRadius: '50%',
          background: '#2563eb', color: '#fff', border: 'none',
          fontSize: 18, cursor: 'pointer', boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
          opacity: 0.55, transition: 'opacity 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.opacity = 1; }}
        onMouseLeave={e => { e.currentTarget.style.opacity = 0.55; }}
      >
        ↑
      </button>

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}
