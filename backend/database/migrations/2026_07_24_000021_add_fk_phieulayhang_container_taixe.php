<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // phieulayhang.macontainer/mataixe chỉ có index (đặt tên *_foreign gây hiểu lầm)
        // chứ chưa từng có ràng buộc khóa ngoại thật — bảng vốn ở MyISAM (đã chuyển
        // InnoDB ở migration 000012). Bổ sung cho đủ, cùng chuẩn với manhanvien.
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->foreign('macontainer', 'fk_ph_cont')
                  ->references('macontainer')->on('container')
                  ->restrictOnDelete()->cascadeOnUpdate();

            $table->foreign('mataixe', 'fk_ph_tx')
                  ->references('mataixe')->on('taixe')
                  ->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->dropForeign('fk_ph_cont');
            $table->dropForeign('fk_ph_tx');
        });
    }
};
