<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Số khoang/hàng/tầng của 1 block bãi thực tế chỉ vài chục là cùng — tinyint đủ dùng
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->unsignedTinyInteger('sokhoang')->change();
            $table->unsignedTinyInteger('sohang')->change();
            $table->unsignedTinyInteger('sotang')->change();
        });
    }

    public function down(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->integer('sokhoang')->change();
            $table->integer('sohang')->change();
            $table->integer('sotang')->change();
        });
    }
};
