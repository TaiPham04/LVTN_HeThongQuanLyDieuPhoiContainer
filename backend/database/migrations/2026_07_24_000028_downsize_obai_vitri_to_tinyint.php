<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Vị trí khoang/hàng/tầng trong 1 block chỉ vài chục là cùng — tinyint đủ dùng
        Schema::table('obai', function (Blueprint $table) {
            $table->unsignedTinyInteger('khoang')->change();
            $table->unsignedTinyInteger('hang')->change();
            $table->unsignedTinyInteger('tang')->change();
        });
    }

    public function down(): void
    {
        Schema::table('obai', function (Blueprint $table) {
            $table->integer('khoang')->change();
            $table->integer('hang')->change();
            $table->integer('tang')->change();
        });
    }
};
