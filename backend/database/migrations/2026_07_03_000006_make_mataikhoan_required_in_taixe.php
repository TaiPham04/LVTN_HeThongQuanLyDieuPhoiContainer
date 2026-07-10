<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Lấy danh sách tài xế chưa có tài khoản
        $ids = DB::table('taixe')->whereNull('mataikhoan')->pluck('mataixe');

        if ($ids->isNotEmpty()) {
            // Xóa các bản ghi liên quan trước
            DB::table('logcong')->whereIn('mataixe', $ids)->update(['mataixe' => null]);
            DB::table('phieulayhang')->whereIn('mataixe', $ids)->delete();
            DB::table('taixe')->whereNull('mataikhoan')->delete();
        }

        Schema::table('taixe', function (Blueprint $table) {
            // Xóa FK cũ (SET NULL) để có thể đổi cột thành NOT NULL
            $table->dropForeign(['mataikhoan']);
        });

        Schema::table('taixe', function (Blueprint $table) {
            $table->unsignedBigInteger('mataikhoan')->nullable(false)->change();
            // Tạo lại FK với cascadeOnDelete
            $table->foreign('mataikhoan')->references('mataikhoan')->on('taikhoan')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->dropForeign(['mataikhoan']);
        });

        Schema::table('taixe', function (Blueprint $table) {
            $table->unsignedBigInteger('mataikhoan')->nullable()->change();
            $table->foreign('mataikhoan')->references('mataikhoan')->on('taikhoan')->nullOnDelete();
        });
    }
};
