// Thông báo nổi góc dưới màn hình — dùng thay cho alert() trình duyệt (xấu, không
// đồng bộ style, không kiểm soát được). Dùng chung: mỗi trang giữ state { msg, type }
// và tự set timeout ẩn đi (xem ví dụ trong LichTauPage.jsx).
export default function Toast({ msg, type = 'success' }) {
  if (!msg) return null;

  const bg = type === 'error' ? '#fef2f2' : '#f0fdf4';
  const cl = type === 'error' ? '#dc2626' : '#16a34a';

  return (
    <div style={{
      position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)',
      background: bg, color: cl, border: `1px solid ${cl}33`,
      borderRadius: 10, padding: '12px 24px', fontSize: 14, fontWeight: 500,
      boxShadow: '0 4px 20px rgba(0,0,0,0.12)', zIndex: 2000, maxWidth: 480,
      textAlign: 'center',
    }}>
      {msg}
    </div>
  );
}
