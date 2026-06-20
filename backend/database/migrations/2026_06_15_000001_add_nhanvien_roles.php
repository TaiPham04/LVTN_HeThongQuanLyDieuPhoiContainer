<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('vaitro')->insert([
            ['tenvaitro' => 'nhanvien_cong'],
            ['tenvaitro' => 'nhanvien_bai'],
        ]);
    }

    public function down(): void
    {
        DB::table('vaitro')->whereIn('tenvaitro', ['nhanvien_cong', 'nhanvien_bai'])->delete();
    }
};
