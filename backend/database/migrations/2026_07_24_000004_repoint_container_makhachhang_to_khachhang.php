<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('container', function (Blueprint $table) {
            $table->dropForeign('fk_cont_kh');
        });

        Schema::table('container', function (Blueprint $table) {
            $table->foreign('makhachhang', 'fk_cont_kh')
                  ->references('makhachhang')->on('khachhang')
                  ->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('container', function (Blueprint $table) {
            $table->dropForeign('fk_cont_kh');
        });

        Schema::table('container', function (Blueprint $table) {
            $table->foreign('makhachhang', 'fk_cont_kh')
                  ->references('mataikhoan')->on('taikhoan')
                  ->nullOnDelete()->cascadeOnUpdate();
        });
    }
};
