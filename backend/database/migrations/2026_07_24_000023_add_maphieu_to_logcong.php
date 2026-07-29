<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trước đây mối liên hệ logcong -> phieulayhang chỉ tồn tại dạng chuỗi text
        // trong ghichu ("Xuất theo phiếu lấy hàng #..."), không truy vấn/join được.
        // Nullable vì dòng "nhập cổng" không có phiếu (khái niệm phiếu chỉ áp dụng
        // cho chiều xuất).
        Schema::table('logcong', function (Blueprint $table) {
            $table->unsignedBigInteger('maphieu')->nullable()->after('macontainer');

            $table->foreign('maphieu', 'fk_lc_ph')
                  ->references('maphieu')->on('phieulayhang')
                  ->nullOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('logcong', function (Blueprint $table) {
            $table->dropForeign('fk_lc_ph');
            $table->dropColumn('maphieu');
        });
    }
};
