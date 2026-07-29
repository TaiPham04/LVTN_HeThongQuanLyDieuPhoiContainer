<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // taixe.sodienthoai: SĐT Việt Nam luôn 10 số — không giống taikhoan.sodienthoai
        // (dùng chung cho khách hàng/nhân viên, có thể là số nước ngoài nên giữ varchar(20)).
        // cccd: CCCD Việt Nam luôn đúng 12 số. biensoxe: đủ cho biển đầu kéo dạng "14B-12345".
        Schema::table('taixe', function (Blueprint $table) {
            $table->string('sodienthoai', 10)->nullable(false)->change();
            $table->string('cccd', 12)->nullable()->change();
            $table->string('biensoxe', 9)->nullable()->change();
        });

        // Cùng khái niệm biển số xe — áp dụng cùng độ dài cho nhất quán
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->string('biensoxe', 9)->nullable()->change();
            $table->string('bienso_romo', 9)->nullable()->change();
        });

        Schema::table('logcong', function (Blueprint $table) {
            $table->string('biensoxe', 9)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->string('sodienthoai', 20)->nullable(false)->change();
            $table->string('cccd', 20)->nullable()->change();
            $table->string('biensoxe', 20)->nullable()->change();
        });

        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->string('biensoxe', 20)->nullable()->change();
            $table->string('bienso_romo', 20)->nullable()->change();
        });

        Schema::table('logcong', function (Blueprint $table) {
            $table->string('biensoxe', 20)->nullable()->change();
        });
    }
};
