<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng scaffolding mặc định của Laravel — app xác thực qua taikhoan (model User
        // trỏ $table='taikhoan'), bảng users chưa từng được dùng và làm DatabaseSeeder lỗi
        // (User::factory() ghi 'name'/'password' — cột không tồn tại trên taikhoan).
        Schema::dropIfExists('users');
    }

    public function down(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });
    }
};
