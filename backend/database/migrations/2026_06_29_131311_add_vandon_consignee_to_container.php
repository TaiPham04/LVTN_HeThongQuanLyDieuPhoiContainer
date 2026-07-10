<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('container', function (Blueprint $table) {
            // Số vận đơn (B/L No.) — để khách hàng claim container nhập sau
            $table->string('so_vandon', 50)->nullable()->after('soniemchi');
            // Tên công ty nhận hàng từ manifest (text, chưa link tài khoản)
            $table->string('ten_consignee', 255)->nullable()->after('so_vandon');
        });
    }

    public function down(): void
    {
        Schema::table('container', function (Blueprint $table) {
            $table->dropColumn(['so_vandon', 'ten_consignee']);
        });
    }
};
