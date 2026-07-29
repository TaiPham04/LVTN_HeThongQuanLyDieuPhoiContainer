<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->dropForeign('fk_bb_nv');
        });

        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->foreign('manhanvien', 'fk_bb_nv')
                  ->references('manhanvien')->on('nhanvien')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->dropForeign('fk_bb_nv');
        });

        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->foreign('manhanvien', 'fk_bb_nv')
                  ->references('mataikhoan')->on('taikhoan')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
