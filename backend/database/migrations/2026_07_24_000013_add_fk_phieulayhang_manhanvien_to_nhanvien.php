<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->foreign('manhanvien', 'fk_ph_nv')
                  ->references('manhanvien')->on('nhanvien')
                  ->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->dropForeign('fk_ph_nv');
        });
    }
};
