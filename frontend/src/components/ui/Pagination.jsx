export default function Pagination({ meta, onChange }) {
  if (!meta || meta.tong_trang <= 1) return null;

  const { trang_hien, tong_trang, tong, per_page } = meta;
  const from = (trang_hien - 1) * per_page + 1;
  const to   = Math.min(trang_hien * per_page, tong);

  const pages = [];
  for (let i = 1; i <= tong_trang; i++) {
    if (
      i === 1 || i === tong_trang ||
      (i >= trang_hien - 1 && i <= trang_hien + 1)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div style={s.wrap}>
      <span style={s.info}>
        Hiển thị {from}–{to} / {tong} kết quả
      </span>
      <div style={s.pages}>
        <PageBtn disabled={trang_hien === 1} onClick={() => onChange(trang_hien - 1)}>‹</PageBtn>
        {pages.map((p, i) =>
          p === '...'
            ? <span key={i} style={s.dots}>...</span>
            : <PageBtn key={p} active={p === trang_hien} onClick={() => onChange(p)}>{p}</PageBtn>
        )}
        <PageBtn disabled={trang_hien === tong_trang} onClick={() => onChange(trang_hien + 1)}>›</PageBtn>
      </div>
    </div>
  );
}

function PageBtn({ children, active, disabled, onClick }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...s.btn,
      background: active ? '#e8920a' : '#fff',
      color: active ? '#fff' : '#374151',
      borderColor: active ? '#e8920a' : '#e5e7eb',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }}>
      {children}
    </button>
  );
}

const s = {
  wrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  info: { fontSize: 13, color: '#6b7280' },
  pages: { display: 'flex', gap: 4, alignItems: 'center' },
  btn: {
    width: 32,
    height: 32,
    border: '1px solid #e5e7eb',
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: { fontSize: 14, color: '#9ca3af', padding: '0 4px' },
};