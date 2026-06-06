// columns: [{ key, label, render?, width?, align? }]
// data: array of objects
export default function Table({ columns, data, loading, emptyText = 'Không có dữ liệu' }) {
  return (
    <div style={s.wrap}>
      <table style={s.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={{
                ...s.th,
                width: col.width,
                textAlign: col.align || 'left',
              }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={columns.length} style={s.center}>
                <div style={s.spinner} />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={s.center}>
                <span style={{ color: '#9ca3af', fontSize: 14 }}>{emptyText}</span>
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={row.id || i} style={s.tr}>
                {columns.map((col) => (
                  <td key={col.key} style={{
                    ...s.td,
                    textAlign: col.align || 'left',
                  }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const s = {
  wrap: {
    width: '100%',
    overflowX: 'auto',
    borderRadius: 10,
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 14,
  },
  th: {
    padding: '11px 14px',
    background: '#f9fafb',
    color: '#6b7280',
    fontWeight: 600,
    fontSize: 12,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background .1s',
  },
  td: {
    padding: '12px 14px',
    color: '#111827',
    verticalAlign: 'middle',
  },
  center: {
    padding: '40px 0',
    textAlign: 'center',
  },
  spinner: {
    width: 28,
    height: 28,
    border: '3px solid #e5e7eb',
    borderTopColor: '#e8920a',
    borderRadius: '50%',
    animation: 'spin 0.7s linear infinite',
    margin: '0 auto',
  },
};