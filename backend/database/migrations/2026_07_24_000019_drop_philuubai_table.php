<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng dư thừa — 0 dòng dữ liệu, không App\Models\PhiLuuBai, không controller/seeder
        // nào dùng. Phí lưu bãi hiện được tính trực tiếp (hardcode đơn giá) trong
        // ContainerKHController/DashboardKHController thay vì đọc từ bảng này.
        Schema::dropIfExists('philuubai');
    }

    public function down(): void
    {
        Schema::create('philuubai', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id('maphiluubai');
            $table->unsignedBigInteger('macontainer');
            $table->date('ngaytinhphi');
            $table->integer('soNgayLuu');
            $table->integer('soNgayMienPhi')->default(0);
            $table->integer('soNgayTinh')->default(0);
            $table->decimal('dongia_ngay', 10, 2);
            $table->decimal('thanhtien', 12, 2);
            $table->boolean('dathanhtoan')->default(false);
            $table->timestamp('thoigian_tt')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('macontainer', 'fk_plb_cont')->references('macontainer')->on('container')->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
