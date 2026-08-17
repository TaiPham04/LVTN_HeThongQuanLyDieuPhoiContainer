import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Toast from '@/components/ui/Toast';
import { useTaiXeKHList, useCreateTaiXeKH, useUpdateTaiXeKH, useDeleteTaiXeKH, useDoiMatKhauTaiXeKH } from '@/hooks/khachhang/useTaiXeKH';

const defValues = { hoten: '', sodienthoai: '', cccd: '', biensoxe: '', email: '', password: '' };
const editDefValues = { hoten: '', sodienthoai: '', biensoxe: '' };
const pwDefValues = { password: '', confirm: '' };

export default function TaiXeKHPage() {
  const [addOpen, setAddOpen]       = useState(false);
  const [editRow, setEditRow]       = useState(null);
  const [deleteRow, setDeleteRow]   = useState(null);
  const [detailRow, setDetailRow]   = useState(null);
  const [serverErr, setServerErr]   = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [toast, setToast]           = useState(null); // { msg, type }

  const showToast = (msg, type = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  };

  const { data, isLoading } = useTaiXeKHList();
  const createMut     = useCreateTaiXeKH();
  const updateMut     = useUpdateTaiXeKH();
  const deleteMut     = useDeleteTaiXeKH();
  const doiMatKhauMut = useDoiMatKhauTaiXeKH();

  const addForm  = useForm({ defaultValues: defValues });
  const editForm = useForm({ defaultValues: editDefValues });
  const pwForm   = useForm({ defaultValues: pwDefValues });

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 6000);
  };

  const openAdd = () => {
    addForm.reset(defValues);
    setServerErr('');
    setAddOpen(true);
  };

  const openEdit = (row) => {
    editForm.reset({ hoten: row.hoten, sodienthoai: row.sodienthoai, biensoxe: row.biensoxe || '' });
    setServerErr('');
    setEditRow(row);
  };

  const openDetail = (row) => {
    pwForm.reset(pwDefValues);
    setServerErr('');
    setDetailRow(row);
  };

  const onDoiMatKhau = async (values) => {
    if (values.password !== values.confirm) {
      pwForm.setError('confirm', { message: 'Mật khẩu xác nhận không khớp.' });
      return;
    }
    setServerErr('');
    try {
      const res = await doiMatKhauMut.mutateAsync({ mataixe: detailRow.mataixe, password: values.password });
      pwForm.reset(pwDefValues);
      showSuccess(res.message);
    } catch (e) {
      setServerErr(e?.response?.data?.message || 'Đã có lỗi.');
    }
  };

  const onAdd = async (values) => {
    setServerErr('');
    try {
      const res = await createMut.mutateAsync(values);
      setAddOpen(false);
      showSuccess(res.message);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi.'));
    }
  };

  const onEdit = async (values) => {
    setServerErr('');
    try {
      const res = await updateMut.mutateAsync({ mataixe: editRow.mataixe, ...values });
      setEditRow(null);
      showSuccess(res.message);
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setServerErr(errs ? Object.values(errs).flat().join(' • ') : (e?.response?.data?.message || 'Đã có lỗi.'));
    }
  };

  const handleDelete = async () => {
    if (!deleteRow) return;
    try {
      const res = await deleteMut.mutateAsync(deleteRow.mataixe);
      showSuccess(res.message);
    } catch (e) {
      showToast(e?.response?.data?.message || 'Không thể xóa.');
    } finally {
      setDeleteRow(null);
    }
  };

  const list = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tài xế của tôi"
        subtitle="Quản lý danh sách tài xế thuộc công ty"
        action={<Button onClick={openAdd}>+ Thêm tài xế</Button>}
      />

      {successMsg && (
        <div style={{ background: '#d1fae5', border: '1px solid #6ee7b7', color: '#065f46', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13 }}>
          {successMsg}
        </div>
      )}

      {isLoading ? (
        <div style={{ color: '#9ca3af', padding: 40, textAlign: 'center' }}>Đang tải…</div>
      ) : list.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: '#9ca3af', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          Chưa có tài xế nào. Nhấn <strong>+ Thêm tài xế</strong> để bắt đầu.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {list.map((tx) => (
            <div key={tx.mataixe} style={s.card}>
              <div style={s.cardTop}>
                <div style={s.avatar}>{tx.hoten.split(' ').pop()[0]?.toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{tx.hoten}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>{tx.sodienthoai}</div>
                </div>
              </div>
              <div style={s.cardBody}>
                <div style={s.infoRow}>
                  <i className="ti ti-id-badge" style={s.infoIcon} />
                  <span>{tx.cccd || '—'}</span>
                </div>
                <div style={s.infoRow}>
                  <i className="ti ti-car" style={s.infoIcon} />
                  <span>{tx.biensoxe || 'Chưa có biển số'}</span>
                </div>
              </div>
              <div style={s.cardFooter}>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>Thêm ngày {tx.created_at}</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Button size="sm" variant="ghost" onClick={() => openDetail(tx)}>Chi tiết</Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(tx)}>Sửa</Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteRow(tx)}>Xóa</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Modal thêm tài xế ── */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Thêm tài xế mới" width={480}>
        <form onSubmit={addForm.handleSubmit(onAdd)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {serverErr}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input
              label="Họ tên"
              placeholder="Nguyễn Văn A"
              error={addForm.formState.errors.hoten?.message}
              {...addForm.register('hoten', { required: 'Bắt buộc.' })}
            />
            <Input
              label="Số điện thoại"
              placeholder="0901234567"
              error={addForm.formState.errors.sodienthoai?.message}
              {...addForm.register('sodienthoai', { required: 'Bắt buộc.' })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Input
              label="CCCD"
              placeholder="012345678901"
              error={addForm.formState.errors.cccd?.message}
              {...addForm.register('cccd', { required: 'Bắt buộc.' })}
            />
            <Input
              label="Biển số xe"
              placeholder="51C-12345"
              {...addForm.register('biensoxe')}
            />
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Thông tin tài khoản hệ thống
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Email đăng nhập"
                type="email"
                placeholder="taixe@example.com"
                error={addForm.formState.errors.email?.message}
                {...addForm.register('email', { required: 'Bắt buộc.', pattern: { value: /\S+@\S+\.\S+/, message: 'Email không hợp lệ.' } })}
              />
              <Input
                label="Mật khẩu"
                type="password"
                placeholder="••••••"
                error={addForm.formState.errors.password?.message}
                {...addForm.register('password', { required: 'Bắt buộc.', minLength: { value: 6, message: 'Tối thiểu 6 ký tự.' } })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setAddOpen(false)}>Hủy</Button>
            <Button type="submit" disabled={addForm.formState.isSubmitting}>
              {addForm.formState.isSubmitting ? 'Đang lưu…' : 'Thêm tài xế'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal sửa tài xế ── */}
      <Modal open={!!editRow} onClose={() => setEditRow(null)} title="Sửa thông tin tài xế" width={400}>
        <form onSubmit={editForm.handleSubmit(onEdit)}>
          {serverErr && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 16 }}>
              {serverErr}
            </div>
          )}

          <div style={{ marginBottom: 12 }}>
            <Input label="Họ tên" {...editForm.register('hoten')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input label="Số điện thoại" {...editForm.register('sodienthoai')} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <Input
              label="CCCD"
              value={editRow?.cccd || ''}
              disabled
              style={{ background: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }}
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <Input label="Biển số xe" placeholder="51C-12345" {...editForm.register('biensoxe')} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button type="button" variant="secondary" onClick={() => setEditRow(null)}>Hủy</Button>
            <Button type="submit" disabled={editForm.formState.isSubmitting}>
              {editForm.formState.isSubmitting ? 'Đang lưu…' : 'Lưu'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal chi tiết tài xế ── */}
      <Modal open={!!detailRow} onClose={() => setDetailRow(null)} title="Chi tiết tài xế" width={440}>
        {detailRow && (
          <div>
            {serverErr && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', color: '#dc2626', fontSize: 13, marginBottom: 14 }}>
                {serverErr}
              </div>
            )}

            {/* Thông tin cơ bản */}
            <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 14px', marginBottom: 16, fontSize: 13 }}>
              {[
                ['Họ tên',        detailRow.hoten],
                ['Số điện thoại', detailRow.sodienthoai],
                ['CCCD',          detailRow.cccd || '—'],
                ['Biển số xe',    detailRow.biensoxe || '—'],
                ['Ngày thêm',     detailRow.created_at],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ color: '#64748b' }}>{k}</span>
                  <span style={{ fontWeight: 500, color: '#0f172a' }}>{v}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
                <span style={{ color: '#64748b' }}>Email đăng nhập</span>
                <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#0f172a', fontWeight: 500 }}>
                  {detailRow.email_login || '—'}
                </span>
              </div>
            </div>

            {/* Đổi mật khẩu */}
            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
                Đặt lại mật khẩu
              </div>
              <form onSubmit={pwForm.handleSubmit(onDoiMatKhau)}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                  <Input
                    label="Mật khẩu mới"
                    type="password"
                    placeholder="••••••"
                    error={pwForm.formState.errors.password?.message}
                    {...pwForm.register('password', { required: 'Bắt buộc.', minLength: { value: 6, message: 'Tối thiểu 6 ký tự.' } })}
                  />
                  <Input
                    label="Xác nhận"
                    type="password"
                    placeholder="••••••"
                    error={pwForm.formState.errors.confirm?.message}
                    {...pwForm.register('confirm', { required: 'Bắt buộc.' })}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button type="button" variant="secondary" onClick={() => setDetailRow(null)}>Đóng</Button>
                  <Button type="submit" disabled={doiMatKhauMut.isPending}>
                    {doiMatKhauMut.isPending ? 'Đang lưu…' : 'Cập nhật mật khẩu'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Modal xác nhận xóa ── */}
      <Modal
        open={!!deleteRow}
        onClose={() => setDeleteRow(null)}
        title="Xác nhận xóa tài xế"
        width={380}
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setDeleteRow(null)}>Hủy</Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Đang xóa…' : 'Xóa'}
            </Button>
          </div>
        }
      >
        {deleteRow && (
          <div style={{ fontSize: 14 }}>
            Bạn có chắc muốn xóa tài xế <strong>{deleteRow.hoten}</strong>?
          </div>
        )}
      </Modal>

      <Toast msg={toast?.msg} type={toast?.type} />
    </div>
  );
}

const s = {
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardTop: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    background: '#0d9488',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: '#374151',
  },
  infoIcon: {
    fontSize: 15,
    color: '#9ca3af',
    flexShrink: 0,
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f3f4f6',
    paddingTop: 10,
  },
};
