import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import Input from './Input';

// dùng chung cho mọi thao tác xóa có 2 lớp xác nhận
// identifier: "22G1", "MAEU"... phần sau "Delete "
export default function ConfirmDelete({
  open,
  onClose,
  onConfirm,
  identifier,      // VD: "22G1"
  tenDoiTuong,     // VD: "Loại container"
  isLoading,
  error,           // Lỗi từ server khi xác nhận thất bại (VD: còn dữ liệu liên kết)
  hanhDong = 'Xóa', // VD: "Hủy" cho chuyến tàu — chỉ đổi nhãn hiển thị, không đổi chuỗi xác nhận
}) {
  const [lydo, setLydo] = useState('');
  const [chuoiXacNhan, setChuoiXacNhan] = useState('');
  const [errors, setErrors] = useState({});

  const chuoiDung = `Delete ${identifier}`;

  const handleClose = () => {
    setLydo('');
    setChuoiXacNhan('');
    setErrors({});
    onClose();
  };

  const handleSubmit = () => {
    const errs = {};
    if (!lydo || lydo.trim().length < 10) {
      errs.lydo = 'Lý do phải có ít nhất 10 ký tự.';
    }
    if (chuoiXacNhan !== chuoiDung) {
      errs.xacnhan = `Vui lòng gõ đúng: "${chuoiDung}"`;
    }
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onConfirm({ lydo_xoa: lydo, xacnhan_xoa: chuoiXacNhan });
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={`${hanhDong} ${tenDoiTuong}`}
      width={460}
      footer={
        <>
          <Button variant="ghost" onClick={handleClose} disabled={isLoading}>
            Đóng
          </Button>
          <Button variant="danger" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? 'Đang xử lý...' : `Xác nhận ${hanhDong.toLowerCase()}`}
          </Button>
        </>
      }
    >
      {/* Lỗi từ server (VD: còn container liên kết, không thể xóa/hủy) */}
      {error && (
        <div style={s.serverErr}>
          {error}
        </div>
      )}

      {/* Cảnh báo */}
      <div style={s.warning}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
        <p style={s.warningText}>
          Thao tác này sẽ vô hiệu hóa <strong>{identifier}</strong>.
          Dữ liệu vẫn được lưu trong hệ thống nhưng sẽ không hiển thị.
        </p>
      </div>

      {/* Lý do xóa */}
      <Input
        label="Lý do xóa"
        placeholder="Nhập lý do xóa (ít nhất 10 ký tự)..."
        value={lydo}
        onChange={(e) => { setLydo(e.target.value); setErrors((p) => ({ ...p, lydo: '' })); }}
        error={errors.lydo}
        required
      />

      {/* Chuỗi xác nhận */}
      <div>
        <label style={s.label}>
          Gõ <code style={s.code}>{chuoiDung}</code> để xác nhận
          <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>
        </label>
        <input
          type="text"
          placeholder={chuoiDung}
          value={chuoiXacNhan}
          onChange={(e) => { setChuoiXacNhan(e.target.value); setErrors((p) => ({ ...p, xacnhan: '' })); }}
          style={{
            ...s.input,
            borderColor: errors.xacnhan ? '#dc2626' : '#e5e7eb',
          }}
        />
        <p style={{ ...s.err, visibility: errors.xacnhan ? 'visible' : 'hidden' }}>
          {errors.xacnhan || 'placeholder'}
        </p>
      </div>
    </Modal>
  );
}

const s = {
  serverErr: {
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#dc2626',
    fontSize: 13,
    marginBottom: 16,
  },
  warning: {
    display: 'flex',
    gap: 10,
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: 8,
    padding: '12px 14px',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  warningText: {
    fontSize: 13,
    color: '#991b1b',
    lineHeight: 1.6,
    margin: 0,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
  },
  code: {
    background: '#f3f4f6',
    padding: '1px 6px',
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#dc2626',
  },
  input: {
    width: '100%',
    padding: '9px 12px',
    fontSize: 14,
    border: '1px solid #e5e7eb',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'inherit',
    color: '#111827',
  },
  err: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
    height: 16,
    lineHeight: '16px',
  },
};