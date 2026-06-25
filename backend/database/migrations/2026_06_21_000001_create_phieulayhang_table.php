<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phieulayhang', function (Blueprint $table) {
            $table->id('maphieu');
            $table->unsignedBigInteger('macontainer');
            $table->unsignedBigInteger('manhanvien');
            $table->unsignedBigInteger('mataixe')->nullable();
            $table->string('biensoxe', 20)->nullable();
            $table->json('vitri_snapshot');
            $table->string('ma_qr', 40)->unique();
            $table->enum('trangthai', ['cho_lay', 'da_lay', 'het_han', 'huy'])->default('cho_lay');
            $table->timestamp('thoigian_xuat');
            $table->timestamp('thoigian_het_han')->nullable();
            $table->timestamp('thoigian_lay')->nullable();
            $table->text('ghichu')->nullable();
            $table->timestamps();

            $table->foreign('macontainer')->references('macontainer')->on('container');
            $table->foreign('manhanvien')->references('mataikhoan')->on('users');
            $table->foreign('mataixe')->references('mataixe')->on('taixe');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phieulayhang');
    }
};
