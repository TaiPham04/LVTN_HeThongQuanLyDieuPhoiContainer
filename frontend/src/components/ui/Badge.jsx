const VARIANTS = {
  success: { background: '#dcfce7', color: '#166534' },
  danger:  { background: '#fee2e2', color: '#991b1b' },
  warning: { background: '#fef9c3', color: '#854d0e' },
  info:    { background: '#dbeafe', color: '#1e40af' },
  gray:    { background: '#f3f4f6', color: '#374151' },
};

export default function Badge({ children, variant = 'gray' }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 12,
      fontWeight: 500,
      ...VARIANTS[variant],
    }}>
      {children}
    </span>
  );
}