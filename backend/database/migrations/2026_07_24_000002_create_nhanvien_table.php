<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('nhanvien', function (Blueprint $table) {
            // Server này default_storage_engine=MyISAM — phải khai rõ InnoDB mới giữ được FK
            $table->engine = 'InnoDB';
            // PK = mataikhoan của tài khoản (shared-PK ISA) — không auto-increment
            $table->unsignedBigInteger('manhanvien');
            $table->primary('manhanvien');
            $table->timestamps();

            $table->foreign('manhanvien', 'fk_nv_tk')
                  ->references('mataikhoan')->on('taikhoan')
                  ->cascadeOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('nhanvien');
    }
};
