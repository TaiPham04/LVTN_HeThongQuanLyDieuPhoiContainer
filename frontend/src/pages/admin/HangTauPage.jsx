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
  useHangTauList,
  useThemHangTau,
  useCapNhatHangTau,
  useXoaHangTau,
  useKhoiPhucHangTau,
} from '@/hooks/admin/useHangTau';

export default function HangTauPage() {
  const [trang, setTrang]           = useState(1);
  const [search, setSearch]         = useState('');
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected]     = useState(null);
  const [serverErr, setServerErr]   = useState('');

  const { data, isLoading } = useHangTauList({ trang, search, per_page: 10 });
  const them     = useThemHangTau();
  const capNhat  = useCapNhatHangTau();
  const xoa      = useXoaHangTau();
  const khoiPhuc = useKhoiPhucHangTau();

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  const moModalThem = () => {
    setSelected(null);
    setServerErr('');
    reset({ mascac: '', tenhangtau: '', quocgia: '', email: '' });
    setModalOpen(true);
  };

  const moModalSua = (row) => {
    setSelected(row);
    setServerErr('');
    Object.entries(row).forEach(([k, v]) => setValue(k, v));
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    setServerErr('');
    try {
      if (selected) {
        await capNhat.mutateAsync({ mahangtau: selected.mahangtau, ...values });
      } else {
        await them.mutateAsync(values);
      }
      setModalOpen(false);
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const onXoa = async (payload) => {
    try {
      await xoa.mutateAsync({ mahangtau: selected.mahangtau, ...payload });
      setDeleteOpen(false);
      setSelected(null);
    } catch (err) {
      setServerErr(err.response?.data?.message || 'Có lỗi xảy ra.');
    }
  };

  const columns = [
    { key: 'mascac',     label: 'Mã SCAC', width: 100 },
    { key: 'tenhangtau', label: 'Tên hãng tàu' },
    { key: 'quocgia',    label: 'Quốc gia',
      render: (v) => v || <span style={{ color: '#9ca3af' }}>—</span> },
    { key: 'email',      label: 'Email liên hệ',
      render: (v) => v || <span style={{ color: '#9ca3af' }}>—</span> },
    { key: 'trangthai',  label: 'Trạng thái', align: 'center',
      render: (v) => v === 'hoatdong'
        ? <Badge variant="success">Hoạt động</Badge>
        : <Badge variant="danger">Vô hiệu</Badge> },
    { key: 'actions', label: 'Thao tác', align: 'center', width: 150,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Button size="sm" variant="ghost" onClick={() => moModalSua(row)}>Sửa</Button>
          {row.trangthai === 'hoatdong'
            ? <Button size="sm" variant="danger" onClick={() => { setSelected(row); setDeleteOpen(true); }}>Xóa</Button>
            : <Button size="sm" variant="secondary" onClick={() => khoiPhuc.mutate(row.mahangtau)}>Khôi phục</Button>
          }
        </div>
      ),
    },
  ];

  const isSaving = them.isPending || capNhat.isPending;

  return (
    <div>
      <PageHeader
        title="Quản lý hãng tàu"
        subtitle="Danh mục hãng tàu theo mã SCAC quốc tế"
        action={
          <Button onClick={moModalThem} icon={<IconPlus />}>Thêm hãng tàu</Button>
        }
      />

      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <input
          placeholder="Tìm theo mã SCAC, tên hoặc quốc gia..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setTrang(1); }}
          style={s.searchInput}
        />
      </div>

      <Table
        columns={columns}
        data={data?.data || []}
        loading={isLoading}
        emptyText="Chưa có hãng tàu nào"
      />
      <Pagination meta={data?.meta} onChange={setTrang} />

      {/* Modal thêm/sửa */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selected ? `Sửa hãng tàu — ${selected.mascac}` : 'Thêm hãng tàu'}
        width={500}
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
            <Input
              label="Mã SCAC" placeholder="VD: MAEU" required
              disabled={!!selected}
              error={errors.mascac?.message}
              {...register('mascac', {
                required: 'Vui lòng nhập mã SCAC.',
                minLength: { value: 4, message: 'Mã SCAC phải đúng 4 ký tự.' },
                maxLength: { value: 4, message: 'Mã SCAC phải đúng 4 ký tự.' },
              })}
            />
            <Input
              label="Tên hãng tàu" placeholder="VD: Maersk Line" required
              error={errors.tenhangtau?.message}
              {...register('tenhangtau', { required: 'Vui lòng nhập tên hãng tàu.' })}
            />
          </div>
          <div style={s.twoCol}>
            <Input
              label="Quốc gia" placeholder="VD: Đan Mạch"
              error={errors.quocgia?.message}
              {...register('quocgia')}
            />
            <Input
              label="Email liên hệ" type="email" placeholder="VD: contact@maersk.com"
              error={errors.email?.message}
              {...register('email', {
                pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ.' },
              })}
            />
          </div>
        </form>
      </Modal>

      {/* Modal xóa */}
      <ConfirmDelete
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setSelected(null); }}
        onConfirm={onXoa}
        identifier={selected?.mascac}
        tenDoiTuong="hãng tàu"
        isLoading={xoa.isPending}
      />
    </div>
  );
}

function IconPlus() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  );
}

const s = {
  searchInput: {
    padding: '9px 12px', fontSize: 14, border: '1px solid #e5e7eb',
    borderRadius: 8, outline: 'none', width: 320, fontFamily: 'inherit',
  },
  errBox: {
    background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8,
    padding: '10px 12px', fontSize: 13, color: '#991b1b', marginBottom: 16,
  },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
};