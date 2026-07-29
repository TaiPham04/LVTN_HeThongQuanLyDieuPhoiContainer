<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Vai trò 'nhanvien' (id=2) không được middleware route nào chấp nhận
        // (chỉ admin/nhanvien_cong/nhanvien_bai/khachhang/taixe) — tài khoản còn
        // lại đã được chuyển sang nhanvien_cong trước khi chạy migration này.
        DB::table('vaitro')->where('mavaitro', 2)->delete();
    }

    public function down(): void
    {
        DB::table('vaitro')->insert(['mavaitro' => 2, 'tenvaitro' => 'nhanvien']);
    }
};
