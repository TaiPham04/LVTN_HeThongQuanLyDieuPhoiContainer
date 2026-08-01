import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useLichTauBaiList } from '@/hooks/nhanvien/useLichTauBai';
import {
  useTallyDanhSach,
  useTallyXacNhan,
} from '@/hooks/nhanvien/useContainerBai';

/* ── helpers ── */
const tinhTrangBadge = (trangthai) => {
  if (trangthai === 'trongbai')   return <Badge variant="success">Đã tiếp nhận</Badge>;
  if (trangthai === 'choxacnhan') return <Badge variant="info">Chờ xác nhận</Badge>;
  return <Badge variant="gray">{trangthai}</Badge>;
};

export default function TiepNhanNhapPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navChuyen = location.state?.chuyentau;

  const [selectedMaCT, setSelectedMaCT] = useState(navChuyen?.machuyentau ?? '');
  const [search, setSearch]             = useState('');
  const [msg, setMsg]                   = useState({ type: '', text: '' });

  const { data: lichData } = useLichTauBaiList({ trangthai: 'dadencang', per_page: 100 });
  const { data: tallyData, isLoading } = useTallyDanhSach(selectedMaCT || null);

  const xacNhanMut  = useTallyXacNhan();

  const toast = (text, type = 'success') => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 6000);
  };

  const handleXacNhan = async (macontainer, socontainer) => {
    try {
      await xacNhanMut.mutateAsync(macontainer);
      toast(`Đã xác nhận ${socontainer} vào bãi.`);
    } catch (e) { toast(e?.response?.data?.message || 'Lỗi.', 'error'); }
  };

  const chuyenList = lichData?.data ?? [];
  const selectedChuyen = navChuyen?.machuyentau === Number(selectedMaCT)
    ? navChuyen
    : chuyenList.find(c => String(c.machuyentau) === String(selectedMaCT));

  const danhSach = tallyData?.data ?? [];
  const stats    = tallyData?.stats ?? {};

  const filtered = search.trim()
    ? danhSach.filter(c => c.socontainer.includes(search.trim().toUpperCase()))
    : danhSach;

  return (
    <div style={{ padding: '0 0 40px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <button
          onClick={() => navigate('/nv/bai/lich-tau')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: 13, display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
        >
          <i className="ti ti-arrow-left" /> Lịch tàu
        </button>
        <span style={{ color: '#e2e8f0' }}>›</span>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Tiếp nhận container nhập</h1>
      </div>

      {/* ── Chọn chuyến tàu nếu không có nav state ── */}
      {!navChuyen && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>
            Chọn chuyến tàu đang cập cảng
          </label>
          <select
            value={selectedMaCT}
            onChange={e => setSelectedMaCT(e.target.value)}
            style={{ width: '100%', maxWidth: 400, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
          >
            <option value="">— Chọn chuyến tàu —</option>
            {chuyenList.map(c => (
              <option key={c.machuyentau} value={c.machuyentau}>
                {c.sovoyage} · {c.tentau}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* ── Info bar chuyến tàu ── */}
      {selectedChuyen && (
        <div style={{
          background: 'linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)',
          border: '1px solid #bae6fd', borderRadius: 10, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 16,
        }}>
          <i className="ti ti-ship" style={{ fontSize: 22, color: '#0284c7', flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#0c4a6e' }}>
              {selectedChuyen.sovoyage} · {selectedChuyen.tentau}
            </div>
            <div style={{ fontSize: 12, color: '#0369a1', marginTop: 2 }}>
              {selectedChuyen.mascac ?? selectedChuyen.tenhangtau} &nbsp;·&nbsp;
              {selectedChuyen.cangxuatphat} → Cát Lái
            </div>
          </div>
          <Badge variant="warning">Đã đến cảng</Badge>
        </div>
      )}

      {/* ── Tiến độ + nút xác nhận tất cả ── */}
      {selectedMaCT && tallyData && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 18px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1 }}>
            <span style={{ fontSize: 26, fontWeight: 800, color: '#16a34a', fontVariantNumeric: 'tabular-nums' }}>
              {stats.trongbai ?? 0}
            </span>
            <span style={{ fontSize: 18, color: '#94a3b8', fontWeight: 400 }}>/</span>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
              {stats.tong ?? 0}
            </span>
            <span style={{ fontSize: 14, color: '#64748b', marginLeft: 4 }}>Đã được xác nhận</span>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {msg.text && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 12, fontSize: 13,
          background: msg.type === 'error' ? '#fef2f2' : '#d1fae5',
          border: `1px solid ${msg.type === 'error' ? '#fca5a5' : '#6ee7b7'}`,
          color: msg.type === 'error' ? '#dc2626' : '#065f46',
        }}>
          {msg.text}
        </div>
      )}

      {/* ── Tìm kiếm ── */}
      {selectedMaCT && (
        <div style={{ marginBottom: 12 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm số container..."
            style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', width: 240 }}
          />
        </div>
      )}

      {/* ── Bảng tally ── */}
      {selectedMaCT && (
        isLoading ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Đang tải danh sách...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            {danhSach.length === 0
              ? 'Chưa có manifest cho chuyến tàu này — Admin cần import manifest trước.'
              : 'Không tìm thấy container phù hợp.'
            }
          </div>
        ) : (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  {['Số container', 'Loại', 'Niêm chì', 'T.lượng (kg)', 'Mô tả hàng', 'Tình trạng', ''].filter(Boolean).map(h => (
                    <th key={h} style={{ padding: '10px 12px', fontSize: 12, fontWeight: 600, color: '#374151', textAlign: h === 'T.lượng (kg)' ? 'center' : 'left', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={row.macontainer} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap' }}>
                      {row.socontainer}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151', whiteSpace: 'nowrap' }}>{row.tenloai}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280' }}>{row.soniemchi || '—'}</td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#374151', textAlign: 'center' }}>
                      {row.trongluong_kg ? Number(row.trongluong_kg).toLocaleString() : '—'}
                    </td>
                    <td style={{ padding: '10px 12px', fontSize: 12, color: '#6b7280', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.mota_hanghoa || '—'}
                    </td>
                    <td style={{ padding: '10px 12px' }}>{tinhTrangBadge(row.trangthai)}</td>
                    <td style={{ padding: '10px 12px' }}>
                      {row.trangthai === 'choxacnhan' && (
                        <button
                          onClick={() => handleXacNhan(row.macontainer, row.socontainer)}
                          disabled={xacNhanMut.isPending}
                          style={{ padding: '5px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <i className="ti ti-check" /> Nhận
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

    </div>
  );
}
