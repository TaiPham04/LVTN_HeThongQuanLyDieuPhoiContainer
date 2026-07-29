import { useState } from 'react';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/shared/PageHeader';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import useAuthStore from '@/store/authStore';
import { useCapNhatProfile, useDoiMatKhau } from '@/hooks/useProfile';

const grid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
  gap: 24,
  maxWidth: 900,
  margin: '0 auto',
};

const card = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  padding: 24,
  alignSelf: 'start',
};

const cardTitle = {
  fontSize: 15,
  fontWeight: 600,
  color: '#111827',
  marginBottom: 18,
};

const alertBox = (ok) => ({
  background: ok ? '#f0fdf4' : '#fef2f2',
  border: `1px solid ${ok ? '#bbf7d0' : '#fecaca'}`,
  borderRadius: 8,
  padding: '10px 14px',
  color: ok ? '#15803d' : '#dc2626',
  fontSize: 13,
  marginBottom: 16,
});

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const capNhat = useCapNhatProfile();
  const doiMatKhau = useDoiMatKhau();

  const [thongBaoTT, setThongBaoTT] = useState(null); // { ok, message }
  const [thongBaoMK, setThongBaoMK] = useState(null);

  const {
    register: registerTT,
    handleSubmit: handleSubmitTT,
    formState: { errors: errorsTT, isSubmitting: isSubmittingTT },
  } = useForm({
    defaultValues: {
      hoten: user?.hoten ?? '',
      sodienthoai: user?.sodienthoai ?? '',
      tentochuc: user?.tentochuc ?? '',
    },
  });

  const {
    register: registerMK,
    handleSubmit: handleSubmitMK,
    reset: resetMK,
    getValues: getValuesMK,
    formState: { errors: errorsMK, isSubmitting: isSubmittingMK },
  } = useForm({
    defaultValues: { matkhau_cu: '', matkhau_moi: '', matkhau_moi_confirmation: '' },
  });

  // ── Cập nhật thông tin cá nhân ──
  const onSubmitTT = async (values) => {
    setThongBaoTT(null);
    const payload = { hoten: values.hoten, sodienthoai: values.sodienthoai || null };
    if (user?.role === 'khachhang') payload.tentochuc = values.tentochuc || null;

    try {
      const { user: userMoi } = await capNhat.mutateAsync(payload);
      updateUser(userMoi);
      setThongBaoTT({ ok: true, message: 'Cập nhật thông tin thành công.' });
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setThongBaoTT({
        ok: false,
        message: errs
          ? Object.values(errs).flat().join(' • ')
          : e?.response?.data?.message || 'Cập nhật thất bại.',
      });
    }
  };

  // ── Đổi mật khẩu ──
  const onSubmitMK = async (values) => {
    setThongBaoMK(null);
    try {
      await doiMatKhau.mutateAsync({
        matkhau_cu: values.matkhau_cu,
        matkhau_moi: values.matkhau_moi,
        matkhau_moi_confirmation: values.matkhau_moi_confirmation,
      });
      setThongBaoMK({ ok: true, message: 'Đổi mật khẩu thành công.' });
      resetMK();
    } catch (e) {
      const errs = e?.response?.data?.errors;
      setThongBaoMK({
        ok: false,
        message: errs
          ? Object.values(errs).flat().join(' • ')
          : e?.response?.data?.message || 'Đổi mật khẩu thất bại.',
      });
    }
  };

  return (
    <div>
      <PageHeader title="Thông tin cá nhân" subtitle="Xem và cập nhật thông tin tài khoản của bạn" />

      <div style={grid}>
      {/* ── Thông tin cá nhân ── */}
      <div style={card}>
        <div style={cardTitle}>Thông tin cá nhân</div>

        {thongBaoTT && <div style={alertBox(thongBaoTT.ok)}>{thongBaoTT.message}</div>}

        <form onSubmit={handleSubmitTT(onSubmitTT)}>
          <Input label="Email" value={user?.email ?? ''} disabled />

          <Input
            label="Họ tên"
            required
            placeholder="Nhập họ tên"
            error={errorsTT.hoten?.message}
            {...registerTT('hoten', {
              required: 'Họ tên không được để trống',
              maxLength: { value: 100, message: 'Tối đa 100 ký tự' },
            })}
          />

          <Input
            label="Số điện thoại"
            placeholder="Nhập số điện thoại"
            error={errorsTT.sodienthoai?.message}
            {...registerTT('sodienthoai', {
              maxLength: { value: 20, message: 'Tối đa 20 ký tự' },
            })}
          />

          {user?.role === 'khachhang' && (
            <Input
              label="Tên tổ chức"
              placeholder="Nhập tên tổ chức"
              error={errorsTT.tentochuc?.message}
              {...registerTT('tentochuc', {
                maxLength: { value: 255, message: 'Tối đa 255 ký tự' },
              })}
            />
          )}

          <Button type="submit" disabled={isSubmittingTT}>
            {isSubmittingTT ? 'Đang lưu…' : 'Cập nhật thông tin'}
          </Button>
        </form>
      </div>

      {/* ── Đổi mật khẩu ── */}
      <div style={card}>
        <div style={cardTitle}>Đổi mật khẩu</div>

        {thongBaoMK && <div style={alertBox(thongBaoMK.ok)}>{thongBaoMK.message}</div>}

        <form onSubmit={handleSubmitMK(onSubmitMK)}>
          <Input
            label="Mật khẩu cũ"
            type="password"
            required
            error={errorsMK.matkhau_cu?.message}
            {...registerMK('matkhau_cu', { required: 'Mật khẩu cũ không được để trống' })}
          />

          <Input
            label="Mật khẩu mới"
            type="password"
            required
            error={errorsMK.matkhau_moi?.message}
            {...registerMK('matkhau_moi', {
              required: 'Mật khẩu mới không được để trống',
              minLength: { value: 8, message: 'Mật khẩu mới phải có ít nhất 8 ký tự' },
            })}
          />

          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            required
            error={errorsMK.matkhau_moi_confirmation?.message}
            {...registerMK('matkhau_moi_confirmation', {
              required: 'Vui lòng xác nhận mật khẩu mới',
              validate: (v) => v === getValuesMK('matkhau_moi') || 'Mật khẩu xác nhận không khớp',
            })}
          />

          <Button type="submit" variant="secondary" disabled={isSubmittingMK}>
            {isSubmittingMK ? 'Đang lưu…' : 'Đổi mật khẩu'}
          </Button>
        </form>
      </div>
      </div>
    </div>
  );
}
