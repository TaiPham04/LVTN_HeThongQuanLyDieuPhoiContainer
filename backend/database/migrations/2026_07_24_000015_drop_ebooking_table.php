<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Bảng dư thừa — 0 dòng dữ liệu, không App\Models\EBooking, không controller nào dùng.
        // Tính năng "đặt lịch" thực tế của khách hàng dùng thẳng bảng container.
        Schema::dropIfExists('ebooking');
    }

    public function down(): void
    {
        Schema::create('ebooking', function (Blueprint $table) {
            $table->engine = 'InnoDB';
            $table->id('mabooking');
            $table->string('mabooking_ref', 50)->unique();
            $table->unsignedBigInteger('makhachhang');
            $table->unsignedBigInteger('macontainer');
            $table->unsignedBigInteger('mataixe')->nullable();
            $table->unsignedBigInteger('maxe')->nullable();
            $table->enum('loaicongviec', ['nhaphang', 'xuathang']);
            $table->dateTime('giobd_slot');
            $table->dateTime('giokt_slot');
            $table->string('token_qr', 100)->unique();
            $table->enum('trangthai', ['choxacnhan', 'daxacnhan', 'dangthuchien', 'hoanthanh', 'dahuy'])
                  ->default('choxacnhan');
            $table->text('ghichu')->nullable();
            $table->timestamp('created_at')->nullable();
            $table->timestamp('updated_at')->nullable();

            $table->foreign('macontainer', 'fk_bk_cont')->references('macontainer')->on('container')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('makhachhang', 'fk_bk_kh')->references('makhachhang')->on('khachhang')->restrictOnDelete()->cascadeOnUpdate();
            $table->foreign('mataixe', 'fk_bk_tx')->references('mataixe')->on('taixe')->nullOnDelete()->cascadeOnUpdate();
            $table->foreign('maxe', 'fk_bk_xe')->references('maxe')->on('xe')->nullOnDelete()->cascadeOnUpdate();
        });
    }
};
