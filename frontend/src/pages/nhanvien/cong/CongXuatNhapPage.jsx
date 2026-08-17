import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import { useLogCongList, useGhiNhanXuatNhap } from '@/hooks/nhanvien/useLogCong';
import { useContainerCongLookup } from '@/hooks/nhanvien/useContainerCong';
import { useLichTauCongList } from '@/hooks/nhanvien/useLichTauCong';
import { useTaiXeListCong } from '@/hooks/nhanvien/useTaiXe';

/* ── helpers ── */
const kieuBadge = (v) =>
  v === 'nhap'
    ? <Badge variant="success">Nhập bãi</Badge>
    : <Badge variant="warning">Xuất bãi</Badge>;

const boolBadge = (v, labelTrue, labelFalse) => {
  if (v === null || v === undefined) return <span style={{ color: '#cbd5e1' }}>—</span>;
  return v
    ? <Badge variant="success">{labelTrue}</Badge>
    : <Badge variant="danger">{labelFalse}</Badge>;
};

const selectStyle = (hasError) => ({
  width: '100%', padding: '8px 12px',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
});

export default function CongXuatNhapNVPage() {
  const [trang, setTrang]             = useState(1);
  const [search, setSearch]           = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterKieu, setFilterKieu]   = useState('');
  const [filterNgay, setFilterNgay]   = useState('');
  const [modalOpen, setModalOpen]     = useState(false);
  const [serverErr, setServerErr]     = useState('');

  const { data, isLoading } = useLogCongList({ trang, search, kieu_xuatnhap: filterKieu, ngay: filterNgay });
  const { data: ctData }    = useLichTauCongList({ trangthai: 'dadencang', per_page: 100 });
  const { data: txData }    = useTaiXeListCong();
  const ghiNhan             = useGhiNhanXuatNhap();

  const danhSachTau    = ctData?.data ?? [];
  const danhSachTaiXe  = txData?.data ?? [];

  const defaultValues = {
    kieu_xuatnhap:   'nhap',
    kieu_phuongtien: 'xetai',
    socontainer:     '',
    biensoxe:        '',
    mataixe:         '',
    machuyentau:     '',
    niemchi_ktra:    '',
    niemchi_ok:      false,
    haiquan_ok:      false,
    ghichu:          '',
  };

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({ defaultValues });

  const kieuXuatNhap   = watch('kieu_xuatnhap');
  const kieuPhuongtien = watch('kieu_phuongtien');
  const socontainerVal = watch('socontainer');
  const niemchiVal     = watch('niemchi_ktra');

  const { data: contLookup } = useContainerCongLookup(socontainerVal);
  const contInfo = contLookup?.data ?? null;

  const canhBaoHaiQuan = kieuXuatNhap === 'xuat'
    && contInfo
    && !contInfo.da_thong_quan;

  const sealMatch = contInfo?.soniemchi && niemchiVal
    ? niemchiVal.toUpperCase() === contInfo.soniemchi.toUpperCase()
    : null;

  useEffect(() => {
    if (sealMatch !== null) setValue('niemchi_ok', sealMatch);
  }, [sealMatch, setValue]);

  const openModal = () => {
    reset(defaultValues);
    setServerErr('');
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    const payload = {
      socontainer:   values.socontainer.toUpperCase(),
      kieu_xuatnhap: values.kieu_xuatnhap,
      biensoxe:      values.kieu_phuongtien === 'xetai' ? (values.biensoxe || null) : null,
      mataixe:       values.kieu_phuongtien === 'xetai' ? (values.mataixe ? parseInt(values.mataixe) : null) : null,
      machuyentau:   values.kieu_phuongtien === 'tau'   ? (values.machuyentau ? parseInt(values.machuyentau) : null) : null,
      niemchi_ktra:  values.niemchi_ktra || null,
      niemchi_ok:    values.niemchi_ok ?? null,
      haiquan_ok:    values.haiquan_ok ?? null,
      ghichu:        values.ghichu || null,
    };
    try {
      await ghiNhan.mutateAsync(payload);
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi xảy ra.'));
    }
  };

  const columns = [
    {
      key: 'socontainer',
      label: 'Container',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: 13 }}>{row.socontainer}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.mascac} {row.tenhangtau}</div>
        </div>
      ),
    },
    { key: 'kieu_xuatnhap', label: 'Loại', align: 'center', render: (v) => kieuBadge(v) },
    {
      key: 'biensoxe',
      label: 'Phương tiện / Tài xế',
      render: (_, row) => {
        if (row.sovoyage) return (
          <div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{row.sovoyage}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{row.tentau}</div>
          </div>
        );
        return (
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{row.biensoxe || <span style={{ color: '#cbd5e1' }}>—</span>}</div>
            {row.hoten_taixe && <div style={{ fontSize: 11, color: '#6b7280' }}>{row.hoten_taixe} · {row.sdt_taixe}</div>}
          </div>
        );
      },
    },
    { key: 'niemchi_ok', label: 'Seal',    align: 'center', render: (v) => boolBadge(v, 'OK', 'Lỗi') },
    { key: 'haiquan_ok', label: 'Hải quan', align: 'center', render: (v) => boolBadge(v, 'OK', 'Chưa duyệt') },
    { key: 'thoigian_xl',      label: 'Thời gian',  render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
    { key: 'hoten_nhanvien',   label: 'Nhân viên',  render: (v) => <span style={{ fontSize: 13 }}>{v}</span> },
  ];

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  return (
    <div>
      <PageHeader
        title="Xuất nhập cổng"
        subtitle="Ghi nhận container vào/ra cổng"
      />

      {/* Thanh tìm kiếm + lọc */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={(e) => { e.preventDefault(); setSearch(searchInput.trim()); setTrang(1); }}
          style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo số container…"
            style={{ flex: 1, maxWidth: 260, padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none' }}
          />
          <Button type="submit" variant="secondary">Tìm</Button>
          {search && <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}>Xóa lọc</Button>}
        </form>
        <select value={filterKieu} onChange={e => { setFilterKieu(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}>
          <option value="">Tất cả</option>
          <option value="nhap">Nhập bãi</option>
          <option value="xuat">Xuất bãi</option>
        </select>
        <input type="date" value={filterNgay}
          onChange={e => { setFilterNgay(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none' }}
        />
        <Button onClick={openModal}>+ Ghi nhận</Button>
      </div>

      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có bản ghi nào" />
      <Pagination
        meta={meta}
        onChange={setTrang}
      />

      {/* Modal ghi nhận */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Ghi nhận xuất nhập cổng" width={500}>
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {serverErr}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Loại <span style={{ color: '#ef4444' }}>*</span></label>
              <select style={selectStyle(false)} {...register('kieu_xuatnhap')}>
                <option value="nhap">Nhập bãi</option>
                <option value="xuat">Xuất bãi</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Phương tiện <span style={{ color: '#ef4444' }}>*</span></label>
              <select style={selectStyle(false)} {...register('kieu_phuongtien')}>
                <option value="xetai">Xe tải</option>
                <option value="tau">Tàu biển</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <Input label="Số container" placeholder="VD: MSCU1234567" error={errors.socontainer?.message}
              {...register('socontainer', {
                required: 'Số container là bắt buộc.',
                onChange: (e) => { e.target.value = e.target.value.toUpperCase(); },
              })} />
            {contInfo && (
              <div style={{ marginTop: 6 }}>
                <div style={{ padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span>Trạng thái: <strong style={{ color: contInfo.trangthai === 'trongbai' ? '#dc2626' : '#16a34a' }}>
                    {contInfo.trangthai === 'trongbai' ? 'Đang trong bãi' : contInfo.trangthai === 'dangky' ? 'Đăng ký' : contInfo.trangthai}
                  </strong></span>
                  <span>Luồng: <strong style={{ color: contInfo.trangthai_haiquan === 'luong_xanh' ? '#16a34a' : contInfo.trangthai_haiquan === 'luong_do' ? '#dc2626' : contInfo.trangthai_haiquan === 'luong_vang' ? '#d97706' : '#6b7280' }}>
                    {{ luong_xanh: 'Luồng xanh', luong_vang: 'Luồng vàng', luong_do: 'Luồng đỏ', chua_khai: 'Chưa khai' }[contInfo.trangthai_haiquan]}
                  </strong></span>
                  <span>Thông quan: <strong style={{ color: contInfo.da_thong_quan ? '#16a34a' : '#dc2626' }}>
                    {contInfo.da_thong_quan ? 'Đã thông quan' : 'Chưa thông quan'}
                  </strong></span>
                  {contInfo.soniemchi && <span>Seal chứng từ: <strong>{contInfo.soniemchi}</strong></span>}
                </div>
                {canhBaoHaiQuan && (
                  <div style={{ marginTop: 6, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                    {contInfo.trangthai_haiquan === 'luong_do'
                      ? 'Container luồng đỏ chưa được thông quan — cần lập biên bản kiểm hóa hải quan đạt yêu cầu trước.'
                      : contInfo.trangthai_haiquan === 'luong_vang'
                        ? 'Container luồng vàng chưa được thông quan — cần lập biên bản kiểm hóa hải quan đạt yêu cầu trước.'
                        : 'Container chưa khai báo hải quan — không thể xuất bãi.'
                    }
                  </div>
                )}
              </div>
            )}
            {socontainerVal?.length >= 11 && !contInfo && (
              <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>Không tìm thấy container này trong hệ thống.</p>
            )}
          </div>

          {kieuPhuongtien === 'xetai' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Input label="Biển số xe" placeholder="VD: 51C-12345" {...register('biensoxe')} />
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Tài xế</label>
                <select style={selectStyle(false)} {...register('mataixe')}>
                  <option value="">— Chọn tài xế —</option>
                  {danhSachTaiXe.map(tx => (
                    <option key={tx.mataixe} value={tx.mataixe}>{tx.hoten} · {tx.sodienthoai}</option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Chuyến tàu (đang ở cảng)</label>
              <select style={selectStyle(false)} {...register('machuyentau')}>
                <option value="">— Chọn chuyến tàu —</option>
                {danhSachTau.map(ct => (
                  <option key={ct.machuyentau} value={ct.machuyentau}>{ct.sovoyage} — {ct.tentau}</option>
                ))}
              </select>
              {danhSachTau.length === 0 && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>Không có tàu nào đang ở trạng thái "Đã đến cảng".</p>}
            </div>
          )}

          {kieuXuatNhap === 'nhap' && (
            <div style={{ marginBottom: 12 }}>
              <Input
                label="Số seal thực tế trên container"
                placeholder={contInfo?.soniemchi ? `Chứng từ: ${contInfo.soniemchi}` : 'Nhập số seal kiểm tra…'}
                {...register('niemchi_ktra')}
              />
              {sealMatch === true && <p style={{ fontSize: 12, color: '#16a34a', marginTop: 4, fontWeight: 500 }}>✓ Khớp với chứng từ — seal hợp lệ</p>}
              {sealMatch === false && <p style={{ fontSize: 12, color: '#dc2626', marginTop: 4, fontWeight: 500 }}>✗ Không khớp — chứng từ ghi: <strong>{contInfo?.soniemchi}</strong>.</p>}
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginTop: 6, cursor: 'pointer', color: '#6b7280' }}>
                <input type="checkbox" {...register('niemchi_ok')} style={{ width: 14, height: 14 }} />
                Xác nhận seal OK
              </label>
            </div>
          )}

          <div style={{ marginBottom: 4 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>Ghi chú</label>
            <textarea rows={2} placeholder="Ghi chú thêm (không bắt buộc)…"
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              {...register('ghichu')} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting || canhBaoHaiQuan}>
              {isSubmitting ? 'Đang lưu…' : 'Ghi nhận'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
