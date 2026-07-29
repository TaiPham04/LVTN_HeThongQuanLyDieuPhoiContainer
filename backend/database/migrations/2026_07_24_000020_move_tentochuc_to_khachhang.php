<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // tentochuc (tên doanh nghiệp) chỉ có ý nghĩa với khách hàng — chuyển sang
        // bảng khachhang thay vì nằm chung trên taikhoan (dùng cho mọi vai trò).
        Schema::table('khachhang', function (Blueprint $table) {
            $table->string('tentochuc', 255)->nullable()->after('makhachhang');
        });

        DB::statement('
            UPDATE khachhang kh
            JOIN taikhoan tk ON kh.makhachhang = tk.mataikhoan
            SET kh.tentochuc = tk.tentochuc
        ');

        Schema::table('taikhoan', function (Blueprint $table) {
            $table->dropColumn('tentochuc');
        });
    }

    public function down(): void
    {
        Schema::table('taikhoan', function (Blueprint $table) {
            $table->string('tentochuc', 255)->nullable()->after('sodienthoai');
        });

        DB::statement('
            UPDATE taikhoan tk
            JOIN khachhang kh ON kh.makhachhang = tk.mataikhoan
            SET tk.tentochuc = kh.tentochuc
        ');

        Schema::table('khachhang', function (Blueprint $table) {
            $table->dropColumn('tentochuc');
        });
    }
};
