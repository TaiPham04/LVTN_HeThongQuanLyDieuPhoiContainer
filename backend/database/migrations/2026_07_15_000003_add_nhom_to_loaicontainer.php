<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->enum('nhom', ['dry','reefer','open_top','flat_rack','platform','hazmat','ventilated'])
                  ->after('maiso')
                  ->default('dry');
        });

        // Gán nhom dựa trên maiso ISO 6346
        $assignments = [
            'dry'        => ['22G1', '42G1', '45G1', 'L5G1'],
            'reefer'     => ['22R1', '42R1', '45R1'],
            'open_top'   => ['22U1', '42U1'],
            'flat_rack'  => ['22P1', '42P1'],
            'platform'   => ['22P3', '42P3'],
            'hazmat'     => ['22T3'],
            'ventilated' => ['22V0'],
        ];

        foreach ($assignments as $nhom => $codes) {
            DB::table('loaicontainer')
                ->whereIn('maiso', $codes)
                ->update(['nhom' => $nhom]);
        }
    }

    public function down(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->dropColumn('nhom');
        });
    }
};
