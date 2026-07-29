<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng dư thừa — 0 dòng dữ liệu, không App\Models\Xe, không controller nào dùng.
        Schema::dropIfExists('xe');
    }

    public function down(): void
    {
        Schema::create('xe', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id('maxe');
            $table->unsignedBigInteger('makhachhang');
            $table->string('biensoxe', 20)->unique();
            $table->string('loaixe', 100);
            $table->enum('trangthai', ['hoatdong', 'khonghoatdong'])->default('hoatdong');
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();
            $table->softDeletes();

            $table->foreign('makhachhang', 'fk_xe_kh')->references('makhachhang')->on('khachhang')->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
