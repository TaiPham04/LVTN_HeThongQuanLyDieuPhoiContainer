<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tính năng ảnh chụp bằng chứng kiểm tra chưa được triển khai — không controller
        // nào cho ghi/đọc, bị loại khỏi BienBanKTResource. Xóa cho tới khi thật sự làm.
        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->dropColumn('anhchup');
        });
    }

    public function down(): void
    {
        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->json('anhchup')->nullable()->after('bi_hong');
        });
    }
};
