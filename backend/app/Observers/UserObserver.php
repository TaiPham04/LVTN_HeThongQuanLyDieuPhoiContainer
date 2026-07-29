<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Facades\DB;

class UserObserver
{
    public function created(User $user): void
    {
        $this->sync($user);
    }

    public function updated(User $user): void
    {
        if ($user->wasChanged('mavaitro')) {
            $this->sync($user);
        }
    }

    // Tạo dòng khachhang/nhanvien tương ứng vai trò hiện tại — chỉ thêm, không xóa
    // (tài khoản từng giữ vai trò nào vẫn hợp lệ giữ dòng đó dù sau đổi vai trò).
    protected function sync(User $user): void
    {
        $now = now();

        if ((int) $user->mavaitro === 3) {
            DB::table('khachhang')->insertOrIgnore([
                'makhachhang' => $user->mataikhoan,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]);
        } elseif (in_array((int) $user->mavaitro, [1, 5, 6], true)) {
            DB::table('nhanvien')->insertOrIgnore([
                'manhanvien' => $user->mataikhoan,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        }
    }
}
