import { useState, useRef } from 'react';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useChuyenTauList } from '@/hooks/admin/useChuyenTau';
import { useManifestDanhSach, useManifestImport, useManifestTemplate } from '@/hooks/admin/useManifest';

const trangthaiBadge = (v) => {
  const map = {
    choxacnhan: { label: 'Chờ xác nhận', variant: 'info'    },
    trongbai:   { label: 'Trong bãi',    variant: 'success' },
    xuatcong:   { label: 'Đã xuất cổng', variant: 'gray'    },
  };
  const b = map[v] || { label: v, variant: 'gray' };
  return <Badge variant={b.variant}>{b.label}</Badge>;
};

export default function ManifestPage() {
  const [machuyentau, setMachuyentau] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [result, setResult] = useState(null);      // { so_thanh_cong, so_loi, errors }
  const [forceConfirm, setForceConfirm] = useState(null); // { machuyentau, file }
  const [msg, setMsg] = useState({ type: '', text: '' });
  const fileRef = useRef(null);

  const { data: chuyenTauData } = useChuyenTauList({ trangthai: 'dalenlich', per_page: 100 });
  const { data: danhSach, isLoading: loadingDS } = useManifestDanhSach(machuyentau || null);
  const importMut  = useManifestImport();
  const downloadTemplate = useManifestTemplate();

  const chuyenTauList = chuyenTauData?.data ?? [];

  const handleImport = async (force = false) => {
    if (!machuyentau || !selectedFile) {
      setMsg({ type: 'error', text: 'Vui lòng chọn chuyến tàu và file manifest.' });
      return;
    }
    setResult(null);
    setMsg({ type: '', text: '' });

    try {
      const res = await importMut.mutateAsync({ machuyentau, file: selectedFile, force });
      setResult(res);
      setMsg({ type: 'success', text: res.message });
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = '';
      setForceConfirm(null);
    } catch (e) {
      const data = e?.response?.data;
      if (e?.response?.status === 409 && data?.can_force) {
        setForceConfirm({ machuyentau, file: selectedFile });
        setMsg({ type: 'warn', text: data.message });
      } else {
        setMsg({ type: 'error', text: data?.message || 'Lỗi không xác định.' });
      }
    }
  };

  const selectedChuyen = chuyenTauList.find(c => String(c.machuyentau) === String(machuyentau));

  const columns = [
    { key: 'socontainer',   label: 'Số container',       render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600, fontSize: 13 }}>{v}</span> },
    { key: 'tenloai',       label: 'Loại',                render: v => <span style={{ fontSize: 12 }}>{v}</span> },
    { key: 'so_vandon',     label: 'B/L No.',             render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#2563eb' }}>{v || '—'}</span> },
    { key: 'ten_consignee', label: 'Consignee',           render: v => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    { key: 'soniemchi',     label: 'Niêm chì',            render: v => <span style={{ fontSize: 12 }}>{v || '—'}</span> },
    { key: 'trongluong_kg', label: 'T.lượng (kg)',        align: 'right', render: v => v ? Number(v).toLocaleString() : '—' },
    { key: 'mota_hanghoa',  label: 'Mô tả hàng hóa',     render: v => <span style={{ fontSize: 12, color: '#6b7280' }}>{v || '—'}</span> },
    { key: 'trangthai',     label: 'Trạng thái',          align: 'center', render: v => trangthaiBadge(v) },
  ];

  return (
    <div>
      <PageHeader
        title="Import Manifest nhập khẩu"
        subtitle="Upload file Excel manifest từ hãng tàu để tạo danh sách container chờ tiếp nhận"
      />

      {/* ── Panel import ── */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Chọn chuyến tàu */}
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              Chuyến tàu
            </label>
            <select
              value={machuyentau}
              onChange={e => { setMachuyentau(e.target.value); setResult(null); }}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
            >
              <option value="">— Chọn chuyến tàu —</option>
              {chuyenTauList.map(c => (
                <option key={c.machuyentau} value={c.machuyentau}>
                  {c.sovoyage} · {c.tentau} · {c.trangthai === 'dadencang' ? '✓ Đã đến cảng' : 'Đã lên lịch'}
                </option>
              ))}
            </select>
          </div>

          {/* Chọn file */}
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>
              File Manifest (.xlsx / .xls / .csv)
            </label>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={e => setSelectedFile(e.target.files[0] || null)}
              style={{ width: '100%', padding: '7px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, background: '#fff' }}
            />
          </div>

          {/* Nút hành động */}
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Button
              onClick={() => handleImport(false)}
              disabled={importMut.isPending || !machuyentau || !selectedFile}
              style={{ background: '#2563eb', color: '#fff', border: 'none' }}
            >
              {importMut.isPending ? 'Đang xử lý…' : 'Import Manifest'}
            </Button>
            <Button variant="secondary" onClick={downloadTemplate}>
              <i className="ti ti-download" style={{ marginRight: 5 }} />
              Tải file mẫu
            </Button>
          </div>
        </div>

        {/* Thông tin chuyến tàu đã chọn */}
        {selectedChuyen && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, fontSize: 13, color: '#374151', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <span><strong>Voyage:</strong> {selectedChuyen.sovoyage}</span>
            <span><strong>Tàu:</strong> {selectedChuyen.tentau}</span>
            <span><strong>Hãng:</strong> {selectedChuyen.mascac} — {selectedChuyen.tenhangtau}</span>
            <span><strong>Hành trình:</strong> {selectedChuyen.cangxuatphat} → Cát Lái</span>
          </div>
        )}

        {/* Thông báo kết quả */}
        {msg.text && (
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8, fontSize: 13,
            background: msg.type === 'error' ? '#fef2f2' : msg.type === 'warn' ? '#fffbeb' : '#d1fae5',
            border: `1px solid ${msg.type === 'error' ? '#fca5a5' : msg.type === 'warn' ? '#fde68a' : '#6ee7b7'}`,
            color: msg.type === 'error' ? '#dc2626' : msg.type === 'warn' ? '#b45309' : '#065f46',
          }}>
            {msg.text}
          </div>
        )}

        {/* Xác nhận ghi đè */}
        {forceConfirm && (
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button
              variant="secondary"
              onClick={() => { setForceConfirm(null); setMsg({ type: '', text: '' }); }}
            >Hủy</Button>
            <Button
              style={{ background: '#dc2626', color: '#fff', border: 'none' }}
              onClick={() => handleImport(true)}
              disabled={importMut.isPending}
            >
              Xác nhận ghi đè manifest cũ
            </Button>
          </div>
        )}

        {/* Chi tiết lỗi */}
        {result?.errors?.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#dc2626', marginBottom: 5 }}>
              Các dòng bị bỏ qua ({result.errors.length}):
            </div>
            <div style={{ background: '#fef2f2', borderRadius: 8, padding: '8px 12px', maxHeight: 120, overflowY: 'auto' }}>
              {result.errors.map((e, i) => (
                <div key={i} style={{ fontSize: 12, color: '#b91c1c', padding: '2px 0' }}>{e}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Ghi chú cột Excel */}
      <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: '#78350f' }}>
        <strong>Cột bắt buộc:</strong> <code>socontainer</code> (ISO 6346: 4 chữ + 7 số), <code>size_type</code> (20DC / 40HC / 20RF..., xem sheet "Mã Size-Type" trong file mẫu) &nbsp;·&nbsp;
        <strong>Nên có:</strong> <code>so_vandon</code> (B/L No.), <code>ten_consignee</code> &nbsp;·&nbsp;
        <strong>Tuỳ chọn:</strong> <code>soniemchi</code>, <code>trongluong_kg</code>, <code>mota_hanghoa</code>
      </div>

      {/* ── Danh sách container đã import ── */}
      {machuyentau && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>
              Danh sách container nhập — {selectedChuyen?.sovoyage}
            </h3>
            {danhSach && (
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                Tổng: <strong>{danhSach.total}</strong> container &nbsp;·&nbsp;
                Chờ XN: <strong style={{ color: '#2563eb' }}>{danhSach.data?.filter(c => c.trangthai === 'choxacnhan').length}</strong> &nbsp;·&nbsp;
                Trong bãi: <strong style={{ color: '#16a34a' }}>{danhSach.data?.filter(c => c.trangthai === 'trongbai').length}</strong>
              </div>
            )}
          </div>
          <Table
            columns={columns}
            data={danhSach?.data ?? []}
            loading={loadingDS}
            emptyText="Chưa có dữ liệu manifest cho chuyến này"
          />
        </>
      )}
    </div>
  );
}
