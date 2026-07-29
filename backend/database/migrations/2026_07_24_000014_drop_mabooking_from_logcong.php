<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cột dư thừa — không controller/resource nào đọc/ghi, chỉ còn trong $fillable.
        // Phải xóa trước khi drop bảng ebooking (FK fk_lc_bk trỏ tới ebooking.mabooking).
        Schema::table('logcong', function (Blueprint $table) {
            $table->dropForeign('fk_lc_bk');
        });

        Schema::table('logcong', function (Blueprint $table) {
            $table->dropColumn('mabooking');
        });
    }

    public function down(): void
    {
        Schema::table('logcong', function (Blueprint $table) {
            $table->unsignedBigInteger('mabooking')->nullable()->after('macontainer');
        });

        Schema::table('logcong', function (Blueprint $table) {
            $table->foreign('mabooking', 'fk_lc_bk')
                  ->references('mabooking')->on('ebooking')
                  ->nullOnDelete()->cascadeOnUpdate();
        });
    }
};
