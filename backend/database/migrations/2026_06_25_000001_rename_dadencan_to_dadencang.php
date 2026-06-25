<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Mở rộng ENUM để chứa cả giá trị mới trong khi update
        DB::statement("ALTER TABLE chuyentau MODIFY trangthai ENUM('dalenlich','dadencang','daroi','dahuy','dadencan') NOT NULL DEFAULT 'dalenlich'");
        DB::table('chuyentau')->where('trangthai', 'dadencan')->update(['trangthai' => 'dadencang']);
        // Xóa giá trị cũ khỏi ENUM
        DB::statement("ALTER TABLE chuyentau MODIFY trangthai ENUM('dalenlich','dadencang','daroi','dahuy') NOT NULL DEFAULT 'dalenlich'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE chuyentau MODIFY trangthai ENUM('dalenlich','dadencan','daroi','dahuy','dadencang') NOT NULL DEFAULT 'dalenlich'");
        DB::table('chuyentau')->where('trangthai', 'dadencang')->update(['trangthai' => 'dadencan']);
        DB::statement("ALTER TABLE chuyentau MODIFY trangthai ENUM('dalenlich','dadencan','daroi','dahuy') NOT NULL DEFAULT 'dalenlich'");
    }
};
