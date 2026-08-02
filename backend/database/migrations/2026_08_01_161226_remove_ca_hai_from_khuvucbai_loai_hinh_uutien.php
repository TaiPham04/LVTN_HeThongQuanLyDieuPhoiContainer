<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Thực tế cảng không có khu vực bãi dùng chung cho cả 2 luồng — mỗi khu vực
        // bắt buộc chuyên biệt cho nhập hoặc xuất. Bỏ hẳn giá trị 'ca_hai' khỏi enum.
        DB::statement("ALTER TABLE `khuvucbai`
            MODIFY COLUMN `loai_hinh_uutien` ENUM('nhap','xuat') NOT NULL DEFAULT 'xuat'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `khuvucbai`
            MODIFY COLUMN `loai_hinh_uutien` ENUM('nhap','xuat','ca_hai') NOT NULL DEFAULT 'ca_hai'");
    }
};
