<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('xe', function (Blueprint $table) {
            $table->dropForeign('fk_xe_kh');
        });

        Schema::table('xe', function (Blueprint $table) {
            $table->foreign('makhachhang', 'fk_xe_kh')
                  ->references('makhachhang')->on('khachhang')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('xe', function (Blueprint $table) {
            $table->dropForeign('fk_xe_kh');
        });

        Schema::table('xe', function (Blueprint $table) {
            $table->foreign('makhachhang', 'fk_xe_kh')
                  ->references('mataikhoan')->on('taikhoan')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
