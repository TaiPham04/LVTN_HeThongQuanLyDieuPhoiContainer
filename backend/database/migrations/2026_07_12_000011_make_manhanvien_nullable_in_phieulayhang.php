<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            // manhanvien được gán sau (khi NV cổng xác nhận), không phải lúc KH tạo phiếu
            $table->dropForeign(['manhanvien']);
            $table->unsignedBigInteger('manhanvien')->nullable()->change();
            $table->foreign('manhanvien')->references('mataikhoan')->on('taikhoan')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->dropForeign(['manhanvien']);
            $table->unsignedBigInteger('manhanvien')->nullable(false)->change();
            $table->foreign('manhanvien')->references('mataikhoan')->on('taikhoan');
        });
    }
};
