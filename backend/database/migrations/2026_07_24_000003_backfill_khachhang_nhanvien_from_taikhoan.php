<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Không lọc deleted_at — tài khoản đã soft-delete vẫn có thể được các FK
        // cũ (container, bienbanktd...) tham chiếu, cần giữ dòng khachhang/nhanvien
        // tương ứng để không phá ràng buộc khi repoint FK ở các migration sau.
        DB::statement("
            INSERT IGNORE INTO khachhang (makhachhang, created_at, updated_at)
            SELECT mataikhoan, NOW(), NOW() FROM taikhoan WHERE mavaitro = 3
        ");

        DB::statement("
            INSERT IGNORE INTO nhanvien (manhanvien, created_at, updated_at)
            SELECT mataikhoan, NOW(), NOW() FROM taikhoan WHERE mavaitro IN (1,2,5,6)
        ");
    }

    public function down(): void
    {
        // No-op: rollback migration trước (drop bảng khachhang/nhanvien) đã dọn sạch dữ liệu này.
    }
};
