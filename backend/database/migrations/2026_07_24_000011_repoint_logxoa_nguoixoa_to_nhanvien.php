<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('logxoa', function (Blueprint $table) {
            $table->dropForeign('fk_lx_nv');
        });

        Schema::table('logxoa', function (Blueprint $table) {
            $table->foreign('nguoixoa', 'fk_lx_nv')
                  ->references('manhanvien')->on('nhanvien')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('logxoa', function (Blueprint $table) {
            $table->dropForeign('fk_lx_nv');
        });

        Schema::table('logxoa', function (Blueprint $table) {
            $table->foreign('nguoixoa', 'fk_lx_nv')
                  ->references('mataikhoan')->on('taikhoan')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
