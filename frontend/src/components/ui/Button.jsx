const VARIANTS = {
  primary:  { background: '#e8920a', color: '#fff', border: 'none' },
  secondary:{ background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' },
  danger:   { background: '#dc2626', color: '#fff', border: 'none' },
  success:  { background: '#16a34a', color: '#fff', border: 'none' },
  ghost:    { background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' },
};

const SIZES = {
  sm: { padding: '6px 12px', fontSize: 13 },
  md: { padding: '9px 16px', fontSize: 14 },
  lg: { padding: '11px 20px', fontSize: 15 },
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  type = 'button',
  disabled = false,
  fullWidth = false,
  icon,
  style: extraStyle = {},
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 8,
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
    transition: 'opacity .15s, background .15s',
    width: fullWidth ? '100%' : 'auto',
    whiteSpace: 'nowrap',
    ...VARIANTS[variant],
    ...SIZES[size],
    ...extraStyle,
  };

  return (
    <button type={type} onClick={onClick} disabled={disabled} style={base}>
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
    </button>
  );
}