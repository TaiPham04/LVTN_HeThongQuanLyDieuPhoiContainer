<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logcong', function (Blueprint $table) {
            $table->dropForeign('fk_lc_nv');
        });

        Schema::table('logcong', function (Blueprint $table) {
            $table->foreign('manhanvien', 'fk_lc_nv')
                  ->references('manhanvien')->on('nhanvien')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('logcong', function (Blueprint $table) {
            $table->dropForeign('fk_lc_nv');
        });

        Schema::table('logcong', function (Blueprint $table) {
            $table->foreign('manhanvien', 'fk_lc_nv')
                  ->references('mataikhoan')->on('taikhoan')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
