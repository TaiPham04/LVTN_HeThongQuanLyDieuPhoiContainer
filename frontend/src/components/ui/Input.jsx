export default function Input({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  required = false,
  style: extraStyle = {},
  ...rest
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      {label && (
        <label style={s.label}>
          {label}
          {required && <span style={{ color: '#dc2626', marginLeft: 2 }}>*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        style={{
          ...s.input,
          borderColor: error ? '#dc2626' : '#e5e7eb',
          background: disabled ? '#f9fafb' : '#fff',
          ...extraStyle,
        }}
        {...rest}
      />
      <p style={{ ...s.err, visibility: error ? 'visible' : 'hidden' }}>
        {error || 'placeholder'}
      </p>
    </div>
  );
}

const s = {
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#374151',
    marginBottom: 6,
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
    transition: 'border-color .15s',
  },
  err: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 4,
    height: 16,
    lineHeight: '16px',
  },
};