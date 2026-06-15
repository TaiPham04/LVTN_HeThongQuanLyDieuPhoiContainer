import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

export default function FilterableTable({ columns, data, loading, emptyText = 'Không có dữ liệu' }) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [sorting, setSorting]           = useState([]);

  const tblColumns = useMemo(() =>
    columns.map(col => ({
      id:          col.key,
      accessorKey: col.key,
      header:      col.label,
      cell: info => col.render
        ? col.render(info.getValue(), info.row.original)
        : (info.getValue() ?? <span style={{ color: '#cbd5e1' }}>—</span>),
      enableSorting: true,
      meta: { width: col.width, align: col.align },
    })),
    [columns]
  );

  const table = useReactTable({
    data: data ?? [],
    columns: tblColumns,
    state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    globalFilterFn: 'includesString',
  });

  const rows  = table.getRowModel().rows;
  const total = (data ?? []).length;

  return (
    <div>
      {/* Search bar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <label style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Tìm kiếm:</label>
        <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Nhập từ khóa..."
          style={{
            padding: '6px 10px', border: '1px solid #d1d5db', borderRadius: 4,
            fontSize: 13, outline: 'none', width: 230,
          }}
        />
      </div>

      {/* Table */}
      <div style={{ width: '100%', overflowX: 'auto', border: '1px solid #dee2e6', borderRadius: 4 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {table.getHeaderGroups()[0].headers.map(h => {
                const sorted = h.column.getIsSorted();
                return (
                  <th
                    key={h.id}
                    onClick={h.column.getToggleSortingHandler()}
                    style={{
                      background: '#f8f9fa', color: '#495057', fontWeight: 600, fontSize: 13,
                      padding: '10px 12px', borderBottom: '2px solid #dee2e6',
                      borderRight: '1px solid #e5e7eb', cursor: 'pointer', userSelect: 'none',
                      whiteSpace: 'nowrap', textAlign: h.column.columnDef.meta?.align || 'left',
                      width: h.column.columnDef.meta?.width,
                    }}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      <span style={{ fontSize: 10, color: sorted ? '#2563eb' : '#adb5bd' }}>
                        {sorted === 'asc' ? '▲' : sorted === 'desc' ? '▼' : '⇅'}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '40px 0', textAlign: 'center' }}>
                  <div style={{
                    width: 28, height: 28, border: '3px solid #e5e7eb',
                    borderTopColor: '#e8920a', borderRadius: '50%',
                    animation: 'spin 0.7s linear infinite', margin: '0 auto',
                  }} />
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
                  {globalFilter ? 'Không tìm thấy kết quả khớp' : emptyText}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr
                  key={row.id}
                  style={{ background: idx % 2 === 0 ? '#fff' : '#f8f9fa', borderBottom: '1px solid #dee2e6' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      style={{
                        padding: '10px 12px', color: '#212529', verticalAlign: 'middle',
                        borderRight: '1px solid #f3f4f6',
                        textAlign: cell.column.columnDef.meta?.align || 'left',
                      }}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Bottom info */}
      <div style={{ fontSize: 13, color: '#6c757d', marginTop: 8 }}>
        {globalFilter
          ? `Hiển thị ${rows.length} / ${total} dòng (đã lọc)`
          : `Tổng cộng ${total} dòng`}
      </div>
    </div>
  );
}
