<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('container', function (Blueprint $table) {
            $table->boolean('da_thong_quan')->default(false)->after('trangthai_haiquan');
        });

        // Luồng xanh luôn được thông quan tự động, không cần kiểm hóa
        DB::table('container')->where('trangthai_haiquan', 'luong_xanh')->update(['da_thong_quan' => true]);
    }

    public function down(): void
    {
        Schema::table('container', function (Blueprint $table) {
            $table->dropColumn('da_thong_quan');
        });
    }
};
