import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Table from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Pagination from '@/components/ui/Pagination';
import {
  useTaiKhoanList,
  useThemTaiKhoan,
  useCapNhatTaiKhoan,
  useVoHieuHoa,
  useKhoiPhuc,
  useResetMatKhau,
} from '@/hooks/admin/useTaiKhoan';

/* ── static data ── */
const VAI_TRO_LIST = [
  { mavaitro: 1, tenvaitro: 'Admin' },
  { mavaitro: 3, tenvaitro: 'Khách hàng' },
  { mavaitro: 4, tenvaitro: 'Tài xế' },
  { mavaitro: 5, tenvaitro: 'NV Cổng' },
  { mavaitro: 6, tenvaitro: 'NV Bãi' },
];

/* ── helpers ── */
const vaiTroBadge = (mavaitro, tenvaitro) => {
  const map = { 1: 'danger', 2: 'info', 3: 'secondary', 4: 'warning', 5: 'info', 6: 'success' };
  return <Badge variant={map[mavaitro] || 'gray'}>{tenvaitro || `Vai trò ${mavaitro}`}</Badge>;
};

const trangThaiBadge = (v) =>
  v === 'hoatdong'
    ? <Badge variant="success">Hoạt động</Badge>
    : <Badge variant="danger">Vô hiệu hóa</Badge>;

const selectStyle = (hasError) => ({
  width: '100%', padding: '8px 12px',
  border: `1px solid ${hasError ? '#ef4444' : '#e2e8f0'}`,
  borderRadius: 8, fontSize: 14, outline: 'none', background: '#fff',
});

const defaultThem = { hoten: '', email: '', matkhau: '', mavaitro: '', sodienthoai: '', tentochuc: '' };
const defaultSua  = { hoten: '', mavaitro: '', sodienthoai: '', tentochuc: '' };

export default function TaiKhoanPage() {
  const [trang, setTrang]               = useState(1);
  const [search, setSearch]             = useState('');
  const [searchInput, setSearchInput]   = useState('');
  const [filterVT, setFilterVT]         = useState('');
  const [filterTT, setFilterTT]         = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editRow, setEditRow]           = useState(null);
  const [resetRow, setResetRow]         = useState(null);
  const [confirmRow, setConfirmRow]     = useState(null); // { row, action: 'voHieuHoa'|'khoiPhuc' }
  const [serverErr, setServerErr]       = useState('');
  const [actionErr, setActionErr]       = useState('');

  const { data, isLoading } = useTaiKhoanList({ trang, search, mavaitro: filterVT, trangthai: filterTT });
  const them      = useThemTaiKhoan();
  const capNhat   = useCapNhatTaiKhoan();
  const voHieuHoa = useVoHieuHoa();
  const khoiPhuc  = useKhoiPhuc();
  const resetMK   = useResetMatKhau();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({ defaultValues: defaultThem });
  const { register: regReset, handleSubmit: handleReset, reset: resetForm,
          formState: { errors: errReset, isSubmitting: isResetting } } = useForm({ defaultValues: { matkhau_moi: '' } });

  /* ── columns ── */
  const columns = [
    {
      key: 'hoten',
      label: 'Họ tên',
      render: (_, row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.hoten}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>{row.email}</div>
        </div>
      ),
    },
    {
      key: 'mavaitro',
      label: 'Vai trò',
      align: 'center',
      render: (_, row) => vaiTroBadge(row.mavaitro, row.tenvaitro),
    },
    {
      key: 'tentochuc',
      label: 'Tổ chức / Công ty',
      render: (v) => v || <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      key: 'sodienthoai',
      label: 'SĐT',
      render: (v) => v || <span style={{ color: '#cbd5e1' }}>—</span>,
    },
    {
      key: 'trangthai',
      label: 'Trạng thái',
      align: 'center',
      render: (v) => trangThaiBadge(v),
    },
    {
      key: 'actions',
      label: 'Thao tác',
      align: 'center',
      width: 210,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button size="sm" variant="ghost" onClick={() => openSua(row)}>Sửa</Button>
          <Button size="sm" variant="secondary" onClick={() => openReset(row)}>Reset MK</Button>
          {row.trangthai === 'hoatdong' ? (
            <Button size="sm" variant="danger"
              onClick={() => setConfirmRow({ row, action: 'voHieuHoa' })}
            >Vô hiệu hóa</Button>
          ) : (
            <Button size="sm" variant="success"
              onClick={() => setConfirmRow({ row, action: 'khoiPhuc' })}
            >Khôi phục</Button>
          )}
        </div>
      ),
    },
  ];

  /* ── open modal thêm / sửa ── */
  const openThem = () => {
    setEditRow(null);
    reset(defaultThem);
    setServerErr('');
    setModalOpen(true);
  };

  const openSua = (row) => {
    setEditRow(row);
    reset({
      hoten:       row.hoten,
      mavaitro:    String(row.mavaitro),
      sodienthoai: row.sodienthoai ?? '',
      tentochuc: row.tentochuc ?? '',
    });
    setServerErr('');
    setModalOpen(true);
  };

  const openReset = (row) => {
    setResetRow(row);
    resetForm({ matkhau_moi: '' });
    setServerErr('');
  };

  /* ── submit thêm/sửa ── */
  const onSubmit = async (values) => {
    setServerErr('');
    try {
      if (editRow) {
        await capNhat.mutateAsync({
          mataikhoan:  editRow.mataikhoan,
          hoten:       values.hoten,
          sodienthoai: values.sodienthoai || null,
          tentochuc: values.tentochuc || null,
        });
      } else {
        await them.mutateAsync({
          hoten:       values.hoten,
          email:       values.email,
          matkhau:     values.matkhau,
          mavaitro:    parseInt(values.mavaitro),
          sodienthoai: values.sodienthoai || null,
          tentochuc: values.tentochuc || null,
        });
      }
      setModalOpen(false);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      if (errs) {
        setServerErr(Object.values(errs).flat().join(' • '));
      } else {
        setServerErr(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
      }
    }
  };

  /* ── submit reset mật khẩu ── */
  const onSubmitReset = async (values) => {
    setServerErr('');
    try {
      await resetMK.mutateAsync({ mataikhoan: resetRow.mataikhoan, matkhau_moi: values.matkhau_moi });
      setResetRow(null);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      if (errs) {
        setServerErr(Object.values(errs).flat().join(' • '));
      } else {
        setServerErr(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
      }
    }
  };

  /* ── confirm vô hiệu hóa / khôi phục ── */
  const handleConfirm = async () => {
    if (!confirmRow) return;
    setActionErr('');
    try {
      if (confirmRow.action === 'voHieuHoa') {
        await voHieuHoa.mutateAsync(confirmRow.row.mataikhoan);
      } else {
        await khoiPhuc.mutateAsync(confirmRow.row.mataikhoan);
      }
      setConfirmRow(null);
    } catch (e) {
      setActionErr(e?.response?.data?.message || 'Đã có lỗi xảy ra.');
    }
  };

  /* ── search ── */
  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setTrang(1);
  };

  const list = data?.data ?? [];
  const meta = data?.meta ?? {};

  /* ─────────── RENDER ─────────── */
  return (
    <div>
      <PageHeader
        title="Quản lý tài khoản"
        subtitle="Quản lý tài khoản người dùng hệ thống"
        action={<Button onClick={openThem}>+ Thêm tài khoản</Button>}
      />

      {/* Thanh tìm kiếm + lọc */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8, flex: 1 }}>
          <input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Tìm theo họ tên hoặc email…"
            style={{
              flex: 1, maxWidth: 300, padding: '8px 12px',
              border: '1px solid #e2e8f0', borderRadius: 8,
              fontSize: 14, outline: 'none',
            }}
          />
          <Button type="submit" variant="secondary">Tìm</Button>
          {search && (
            <Button variant="ghost" onClick={() => { setSearch(''); setSearchInput(''); setTrang(1); }}>
              Xóa lọc
            </Button>
          )}
        </form>

        <select
          value={filterVT}
          onChange={e => { setFilterVT(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả vai trò</option>
          {VAI_TRO_LIST.map(vt => (
            <option key={vt.mavaitro} value={vt.mavaitro}>{vt.tenvaitro}</option>
          ))}
        </select>

        <select
          value={filterTT}
          onChange={e => { setFilterTT(e.target.value); setTrang(1); }}
          style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13, outline: 'none', background: '#fff' }}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="hoatdong">Hoạt động</option>
          <option value="khonghoatdong">Vô hiệu hóa</option>
        </select>
      </div>

      {/* Bảng */}
      <Table columns={columns} data={list} loading={isLoading} emptyText="Chưa có tài khoản nào" />

      {/* Phân trang */}
      <Pagination
        meta={meta}
        onChange={setTrang}
      />

      {/* ── Modal Thêm / Sửa ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editRow ? `Sửa tài khoản — ${editRow.email}` : 'Thêm tài khoản mới'}
        width={520}
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          {serverErr && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '10px 14px',
              color: '#dc2626', fontSize: 13, marginBottom: 16,
            }}>
              {serverErr}
            </div>
          )}

          {/* Họ tên */}
          <div style={{ marginBottom: 12 }}>
            <Input
              label="Họ tên"
              placeholder="VD: Nguyễn Văn A"
              error={errors.hoten?.message}
              {...register('hoten', { required: 'Họ tên là bắt buộc.' })}
            />
          </div>

          {/* Email + Mật khẩu (chỉ khi thêm mới) */}
          {!editRow && (
            <>
              <div style={{ marginBottom: 12 }}>
                <Input
                  label="Email"
                  type="email"
                  placeholder="VD: nhanvien@catlai.vn"
                  error={errors.email?.message}
                  {...register('email', {
                    required: 'Email là bắt buộc.',
                    pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Email không hợp lệ.' },
                  })}
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="Ít nhất 8 ký tự"
                  error={errors.matkhau?.message}
                  {...register('matkhau', {
                    required: 'Mật khẩu là bắt buộc.',
                    minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự.' },
                  })}
                />
              </div>
            </>
          )}

          {/* Vai trò — chỉ chọn được lúc tạo mới, không đổi được sau khi đã tạo tài khoản */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 4 }}>
              Vai trò {!editRow && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {editRow ? (
              <div style={{
                padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8,
                background: '#f8fafc', fontSize: 14, color: '#374151',
              }}>
                {VAI_TRO_LIST.find(vt => vt.mavaitro === editRow.mavaitro)?.tenvaitro || `Vai trò ${editRow.mavaitro}`}
              </div>
            ) : (
              <>
                <select style={selectStyle(errors.mavaitro)} {...register('mavaitro', { required: 'Vui lòng chọn vai trò.' })}>
                  <option value="">— Chọn vai trò —</option>
                  {VAI_TRO_LIST.map(vt => (
                    <option key={vt.mavaitro} value={vt.mavaitro}>{vt.tenvaitro}</option>
                  ))}
                </select>
                {errors.mavaitro && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.mavaitro.message}</p>}
              </>
            )}
          </div>

          {/* SĐT + Tổ chức */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 4 }}>
            <Input
              label="Số điện thoại"
              placeholder="VD: 0901234567"
              error={errors.sodienthoai?.message}
              {...register('sodienthoai', { maxLength: { value: 20, message: 'Tối đa 20 ký tự.' } })}
            />
            <Input
              label="Tổ chức / Công ty"
              placeholder="VD: Cảng Cát Lái"
              error={errors.tentochuc?.message}
              {...register('tentochuc', { maxLength: { value: 255, message: 'Tối đa 255 ký tự.' } })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Đang lưu…' : editRow ? 'Cập nhật' : 'Tạo tài khoản'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal Reset mật khẩu ── */}
      {resetRow && (
        <Modal
          open={!!resetRow}
          onClose={() => setResetRow(null)}
          title={`Đặt lại mật khẩu`}
          width={420}
        >
          <div style={{
            background: '#f0f9ff', border: '1px solid #bae6fd',
            borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13,
          }}>
            <div style={{ fontWeight: 600 }}>{resetRow.hoten}</div>
            <div style={{ color: '#0369a1' }}>{resetRow.email}</div>
          </div>

          <form onSubmit={handleReset(onSubmitReset)}>
            {serverErr && (
              <div style={{
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: 8, padding: '10px 14px',
                color: '#dc2626', fontSize: 13, marginBottom: 12,
              }}>
                {serverErr}
              </div>
            )}

            <div style={{ marginBottom: 4 }}>
              <Input
                label="Mật khẩu mới"
                type="password"
                placeholder="Ít nhất 8 ký tự"
                error={errReset.matkhau_moi?.message}
                {...regReset('matkhau_moi', {
                  required: 'Mật khẩu mới là bắt buộc.',
                  minLength: { value: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự.' },
                })}
              />
            </div>

            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, marginBottom: 16 }}>
              Tất cả phiên đăng nhập của tài khoản này sẽ bị thu hồi sau khi đặt lại mật khẩu.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button type="button" variant="secondary" onClick={() => setResetRow(null)}>Hủy</Button>
              <Button type="submit" variant="danger" disabled={isResetting}>
                {isResetting ? 'Đang lưu…' : 'Đặt lại mật khẩu'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Modal xác nhận Vô hiệu hóa / Khôi phục ── */}
      {confirmRow && (
        <Modal
          open={!!confirmRow}
          onClose={() => { setConfirmRow(null); setActionErr(''); }}
          title={confirmRow.action === 'voHieuHoa' ? 'Xác nhận vô hiệu hóa' : 'Xác nhận khôi phục'}
          width={400}
        >
          <p style={{ fontSize: 14, color: '#374151', marginBottom: 8 }}>
            {confirmRow.action === 'voHieuHoa'
              ? <>Bạn có chắc muốn vô hiệu hóa tài khoản <strong>{confirmRow.row.email}</strong>? Người dùng sẽ không thể đăng nhập.</>
              : <>Bạn có chắc muốn khôi phục tài khoản <strong>{confirmRow.row.email}</strong>?</>
            }
          </p>

          {actionErr && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: 8, padding: '8px 12px',
              color: '#dc2626', fontSize: 13, marginBottom: 12,
            }}>
              {actionErr}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
            <Button variant="secondary" onClick={() => { setConfirmRow(null); setActionErr(''); }}>Hủy</Button>
            <Button
              variant={confirmRow.action === 'voHieuHoa' ? 'danger' : 'success'}
              onClick={handleConfirm}
              disabled={voHieuHoa.isPending || khoiPhuc.isPending}
            >
              {(voHieuHoa.isPending || khoiPhuc.isPending) ? 'Đang xử lý…'
                : confirmRow.action === 'voHieuHoa' ? 'Vô hiệu hóa' : 'Khôi phục'}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
