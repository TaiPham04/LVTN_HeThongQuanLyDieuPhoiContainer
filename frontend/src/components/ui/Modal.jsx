import { useEffect } from 'react';
import Button from './Button';

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 520,
}) {
  // Đóng khi nhấn Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div style={s.backdrop} onClick={onClose}>
      <div
        style={{ ...s.modal, width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={s.header}>
          <span style={s.title}>{title}</span>
          <button onClick={onClose} style={s.closeBtn} type="button">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={s.body}>{children}</div>

        {/* Footer */}
        {footer && <div style={s.footer}>{footer}</div>}
      </div>
    </div>
  );
}

const s = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modal: {
    background: '#fff',
    borderRadius: 12,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderBottom: '1px solid #f3f4f6',
  },
  title: {
    fontSize: 16,
    fontWeight: 600,
    color: '#111827',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
    padding: 4,
    borderRadius: 6,
  },
  body: {
    padding: '20px',
    overflowY: 'auto',
    flex: 1,
  },
  footer: {
    padding: '12px 20px',
    borderTop: '1px solid #f3f4f6',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
  },
};