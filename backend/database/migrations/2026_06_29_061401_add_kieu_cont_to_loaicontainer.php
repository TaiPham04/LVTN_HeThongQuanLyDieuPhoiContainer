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
            $table->string('kieu_cont', 20)->default('DC')->after('maiso');
        });

        // Map mã iso → kieu_cont
        $map = [
            'DC' => ['22G1', '42G1'],
            'HC' => ['45G1', '45HC'],
            'RF' => ['22R1', '45R1', '40RH'],
            'OT' => ['20OT', '40OT'],
            'FR' => ['20FR', '40FR'],
            'PF' => ['20PF', '40PF'],
            'TK' => ['TK20'],
            'VH' => ['20VH'],
        ];

        foreach ($map as $kieu => $maisos) {
            DB::table('loaicontainer')
                ->whereIn('maiso', $maisos)
                ->update(['kieu_cont' => $kieu]);
        }
    }

    public function down(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->dropColumn('kieu_cont');
        });
    }
};
