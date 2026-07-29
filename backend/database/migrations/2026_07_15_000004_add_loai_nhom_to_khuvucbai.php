<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->enum('loai_nhom', ['dry','reefer','open_top','flat_rack','platform','hazmat','ventilated'])
                  ->after('sotang')
                  ->default('dry');
        });

        // Ưu tiên: reefer > hazmat > open_top > flat_rack > platform > ventilated > dry
        foreach (['ventilated','platform','flat_rack','open_top','hazmat','reefer'] as $nhom) {
            DB::statement("
                UPDATE khuvucbai kv
                SET kv.loai_nhom = ?
                WHERE EXISTS (
                    SELECT 1 FROM loaicontainer_khuvuc lck
                    JOIN loaicontainer lc ON lck.maloai = lc.maloai
                    WHERE lck.makhuvuc = kv.makhuvuc AND lc.nhom = ?
                )
            ", [$nhom, $nhom]);
        }
    }

    public function down(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->dropColumn('loai_nhom');
        });
    }
};
