import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import ConfirmDelete from '@/components/ui/ConfirmDelete';
import {
  useLoaiContainerList,
  useThemLoaiContainer,
  useCapNhatLoaiContainer,
  useXoaLoaiContainer,
  useKhoiPhucLoaiContainer,
} from '@/hooks/admin/useLoaiContainer';


const NHOM_LABEL = {
  dry:'Khô (Dry)', reefer:'Lạnh (Reefer)', open_top:'Open Top',
  flat_rack:'Flat Rack', platform:'Platform', hazmat:'Hàng nguy hiểm', ventilated:'Thông gió',
};

const NHOM_OPTIONS = Object.entries(NHOM_LABEL).map(([value, label]) => ({ value, label }));

export default function LoaiContainerPage() {
  const [trang, setTrang]           = useState(1);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [serverErr, setServerErr]   = useState('');
  const [xoaErr, setXoaErr]         = useState('');

  const { data, isLoading } = useLoaiContainerList({ trang, search, per_page: 10 });
  const them     = useThemLoaiContainer();
  const capNhat  = useCapNhatLoaiContainer();
  const xoa      = useXoaLoaiContainer();
  const khoiPhuc = useKhoiPhucLoaiContainer();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const moModalThem = () => {
    setSelected(null); setServerErr('');
    reset({ maiso:'', nhom:'dry', tenloai:'', chieudai_ft:'', chieurong_ft:'', chieucao_ft:'',
            taitrong_kg:'', gialuubai_ngay:'', soNgayMienPhi:3 });
    setModalOpen(true);
  };

  const moModalSua = (row) => {
    setSelected(row); setServerErr('');
    Object.entries(row).forEach(([k, v]) => setValue(k, v));
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      if (selected) await capNhat.mutateAsync({ maloai: selected.maloai, ...values });
      else await them.mutateAsync(values);
      setModalOpen(false);
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const onXoa = async (payload) => {
    setXoaErr('');
    try {
      await xoa.mutateAsync({ maloai: selected.maloai, ...payload });
      setDeleteOpen(false); setSelected(null);
    } catch (err) {
      setXoaErr(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    { key: 'maiso',   label: 'Mã ISO',  width: 90 },
    { key: 'nhom', label: 'Nhóm', align: 'center',
      render: (v) => <span style={{ fontSize:12, fontWeight:600, color:'#475569',
        background:'#f1f5f9', border:'1px solid #e2e8f0', borderRadius:4, padding:'2px 8px' }}>
        {NHOM_LABEL[v] ?? v}
      </span>
    },
    { key: 'tenloai', label: 'Tên loại' },
    { key: 'kich_thuoc', label: 'Kích thước (ft)',
      render: (_, r) => `${r.chieudai_ft} × ${r.chieurong_ft} × ${r.chieucao_ft}` },
    { key: 'taitrong_kg', label: 'Tải trọng (kg)', align: 'right',
      render: (v) => Number(v).toLocaleString('vi-VN') },
    { key: 'gialuubai_ngay', label: 'Giá lưu bãi/ngày', align: 'right',
      render: (v) => `$${Number(v).toFixed(2)}` },
    { key: 'soNgayMienPhi', label: 'Miễn phí', align: 'center',
      render: (v) => `${v} ngày` },
    { key: 'trangthai', label: 'Trạng thái', align: 'center',
      render: (v) => v === 'hoatdong'
        ? <Badge variant="success">Hoạt động</Badge>
        : <Badge variant="danger">Vô hiệu</Badge> },
    { key: 'actions', label: 'Thao tác', align: 'center', width: 150,
      render: (_, row) => (
        <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
          <Button size="sm" variant="ghost" onClick={() => moModalSua(row)}>Sửa</Button>
          {row.trangthai === 'hoatdong'
            ? <Button size="sm" variant="danger"
                onClick={() => { setSelected(row); setXoaErr(''); setDeleteOpen(true); }}
                disabled={row.so_container_dang_dung > 0}
                title={row.so_container_dang_dung > 0
                  ? `Không thể xóa — đang có ${row.so_container_dang_dung} container sử dụng loại này.`
                  : undefined}
              >Xóa</Button>
            : <Button size="sm" variant="secondary" onClick={() => khoiPhuc.mutate(row.maloai)}>Khôi phục</Button>
          }
        </div>
      ),
    },
  ];

  const isSaving = them.isPending || capNhat.isPending;

  return (
    <div>
      <PageHeader
        title="Quản lý loại container"
        subtitle="Danh mục loại container theo chuẩn ISO 6346"
        action={
          <Button onClick={moModalThem} icon={<IconPlus />}>Thêm loại container</Button>
        }
      />

      <div style={{ display:'flex', gap:10, marginBottom:16 }}>
        <input placeholder="Tìm theo mã ISO hoặc tên..." value={search}
          onChange={(e) => { setSearch(e.target.value); setTrang(1); }}
          style={s.searchInput} />
      </div>

      <Table columns={columns} data={data?.data || []} loading={isLoading}
        emptyText="Chưa có loại container nào" />
      <Pagination meta={data?.meta} onChange={setTrang} />

      {/* Modal thêm/sửa */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={selected ? `Sửa — ${selected.maiso}` : 'Thêm loại container'}
        width={600}
        footer={
          <>
            <Button variant="ghost" onClick={() => setModalOpen(false)} disabled={isSaving}>Hủy</Button>
            <Button onClick={handleSubmit(onSubmit)} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : selected ? 'Cập nhật' : 'Thêm mới'}
            </Button>
          </>
        }
      >
        {serverErr && <div style={s.errBox}>{serverErr}</div>}
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div style={s.twoCol}>
            <Input label="Mã ISO 6346" placeholder="VD: 22G1" required disabled={!!selected} error={errors.maiso?.message}
              {...register('maiso', { required:'Vui lòng nhập mã ISO.', maxLength:{value:4,message:'Tối đa 4 ký tự.'} })} />
            <div>
              <label style={{ display:'block', fontSize:13, fontWeight:500, color:'#374151', marginBottom:6 }}>
                Nhóm container <span style={{color:'#ef4444'}}>*</span>
              </label>
              <select style={{ width:'100%', padding:'8px 12px', border:'1px solid #e5e7eb',
                borderRadius:8, fontSize:14, background:'#fff', outline:'none', cursor:'pointer' }}
                {...register('nhom', { required:'Vui lòng chọn nhóm.' })}>
                {NHOM_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {errors.nhom && <p style={{color:'#dc2626',fontSize:12,marginTop:4}}>{errors.nhom.message}</p>}
            </div>
          </div>
          <div>
            <Input label="Tên loại container" placeholder="VD: Container 20ft khô" required
              error={errors.tenloai?.message}
              {...register('tenloai', { required:'Vui lòng nhập tên loại.' })} />
          </div>
          <div style={s.threeCol}>
            <Input label="Dài (ft)" type="number" required error={errors.chieudai_ft?.message}
              {...register('chieudai_ft', { required:'Bắt buộc.', min:{value:1,message:'Phải > 0'} })} />
            <Input label="Rộng (ft)" type="number" required error={errors.chieurong_ft?.message}
              {...register('chieurong_ft', { required:'Bắt buộc.', min:{value:1,message:'Phải > 0'} })} />
            <Input label="Cao (ft)" type="number" required error={errors.chieucao_ft?.message}
              {...register('chieucao_ft', { required:'Bắt buộc.', min:{value:1,message:'Phải > 0'} })} />
          </div>
          <div style={s.twoCol}>
            <Input label="Tải trọng (kg)" type="number" required error={errors.taitrong_kg?.message}
              {...register('taitrong_kg', { required:'Bắt buộc.', min:{value:1,message:'Phải > 0'} })} />
            <Input label="Giá lưu bãi/ngày (USD)" type="number" required
              error={errors.gialuubai_ngay?.message}
              {...register('gialuubai_ngay', { required:'Bắt buộc.', min:{value:0,message:'Không được âm.'} })} />
          </div>
          <Input label="Số ngày miễn phí" type="number" required
            error={errors.soNgayMienPhi?.message}
            {...register('soNgayMienPhi', { required:'Bắt buộc.', min:{value:0,message:'Không được âm.'} })} />
        </form>
      </Modal>

      {/* Modal xóa */}
      <ConfirmDelete open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelected(null); setXoaErr(''); }}
        onConfirm={onXoa} identifier={selected?.maiso}
        tenDoiTuong="loại container" isLoading={xoa.isPending} error={xoaErr} />
    </div>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

const s = {
  searchInput: { padding:'9px 12px', fontSize:14, border:'1px solid #e5e7eb',
    borderRadius:8, outline:'none', width:300, fontFamily:'inherit' },
  errBox: { background:'#fef2f2', border:'1px solid #fecaca', borderRadius:8,
    padding:'10px 12px', fontSize:13, color:'#991b1b', marginBottom:16 },
  twoCol:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  threeCol: { display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 },
  checkLabel: { display:'flex', alignItems:'center', fontSize:14, color:'#374151', cursor:'pointer' },
};