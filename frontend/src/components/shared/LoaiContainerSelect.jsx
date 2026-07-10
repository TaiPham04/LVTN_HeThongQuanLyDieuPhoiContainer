import { useState, useEffect } from 'react';

// Tên hiển thị cho từng kieu_cont
const KIEU_LABEL = {
  DC: 'Dry Container (DC) — Khô tiêu chuẩn',
  HC: 'High Cube (HC) — Khô cao',
  RF: 'Reefer (RF) — Lạnh',
  OT: 'Open Top (OT) — Mở nóc',
  FR: 'Flat Rack (FR) — Sàn phẳng',
  PF: 'Platform (PF) — Nền tảng',
  TK: 'ISO Tank (TK) — Bồn chứa',
  VH: 'Ventilated (VH) — Thông gió',
};

const sel = (hasErr) => ({
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${hasErr ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8,
  fontSize: 14,
  outline: 'none',
  background: '#fff',
  fontFamily: 'inherit',
});

/**
 * Props:
 *   loaiList   — mảng từ API /loai-container (có kieu_cont, kichthuoc, maloai, tenloai)
 *   value      — maloai đang chọn (number | string | '')
 *   onChange   — fn(maloai: number)
 *   error      — chuỗi lỗi (hiển thị dưới)
 *   disabled   — boolean
 *   label      — hiển thị label hay không (default: true)
 */
export default function LoaiContainerSelect({ loaiList = [], value, onChange, error, disabled, label = true }) {
  // Nhóm theo kieu_cont
  const groups = loaiList.reduce((acc, l) => {
    const k = l.kieu_cont || 'DC';
    if (!acc[k]) acc[k] = [];
    acc[k].push(l);
    return acc;
  }, {});

  const kieuList = Object.keys(groups).sort();

  // Derive kieu hiện tại từ value
  const currentLoai = loaiList.find(l => l.maloai === Number(value) || l.maloai === value);
  const [kieuChon, setKieuChon] = useState(currentLoai?.kieu_cont || '');
  const [kichThuocChon, setKichThuocChon] = useState(currentLoai?.kichthuoc || '');

  // Khi value thay đổi từ bên ngoài (reset form)
  useEffect(() => {
    const loai = loaiList.find(l => l.maloai === Number(value) || l.maloai === value);
    if (loai) {
      setKieuChon(loai.kieu_cont || '');
      setKichThuocChon(loai.kichthuoc || '');
    } else if (!value) {
      setKieuChon('');
      setKichThuocChon('');
    }
  }, [value, loaiList]);

  // Danh sách kích thước của loại đang chọn
  const kichThuocList = kieuChon
    ? [...new Set((groups[kieuChon] || []).map(l => l.kichthuoc))].sort()
    : [];

  const handleKieu = (kieu) => {
    setKieuChon(kieu);
    setKichThuocChon('');
    onChange(''); // reset maloai
  };

  const handleKichThuoc = (kichthuoc) => {
    setKichThuocChon(kichthuoc);
    // Tìm maloai tương ứng
    const match = (groups[kieuChon] || []).find(l => l.kichthuoc === kichthuoc);
    onChange(match ? match.maloai : '');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {/* Loại container */}
      <div>
        {label && (
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
            Loại container <span style={{ color: '#ef4444' }}>*</span>
          </label>
        )}
        <select
          style={sel(!!error && !kieuChon)}
          value={kieuChon}
          onChange={e => handleKieu(e.target.value)}
          disabled={disabled}
        >
          <option value="">— Chọn loại —</option>
          {kieuList.map(k => (
            <option key={k} value={k}>{KIEU_LABEL[k] || k}</option>
          ))}
        </select>
      </div>

      {/* Kích thước */}
      <div>
        {label && (
          <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
            Kích thước <span style={{ color: '#ef4444' }}>*</span>
          </label>
        )}
        <select
          style={sel(!!error && kieuChon && !kichThuocChon)}
          value={kichThuocChon}
          onChange={e => handleKichThuoc(e.target.value)}
          disabled={disabled || !kieuChon}
        >
          <option value="">{kieuChon ? '— Chọn kích thước —' : '— Chọn loại trước —'}</option>
          {kichThuocList.map(kt => (
            <option key={kt} value={kt}>{kt}</option>
          ))}
        </select>
        {error && (
          <span style={{ fontSize: 12, color: '#ef4444', marginTop: 4, display: 'block' }}>{error}</span>
        )}
      </div>
    </div>
  );
}
