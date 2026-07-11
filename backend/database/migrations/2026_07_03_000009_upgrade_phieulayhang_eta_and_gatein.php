<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Drop TIME columns (from migration 000008)
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->dropColumn(['eta_tu', 'eta_den']);
        });

        // Recreate as TIMESTAMP + add thoigian_vao_cong
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->timestamp('thoigian_vao_cong')->nullable()->after('thoigian_den_cang');
            $table->timestamp('eta_tu')->nullable()->after('thoigian_lay');
            $table->timestamp('eta_den')->nullable()->after('eta_tu');
        });
    }

    public function down(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->dropColumn(['thoigian_vao_cong', 'eta_tu', 'eta_den']);
        });

        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->time('eta_tu')->nullable();
            $table->time('eta_den')->nullable();
        });
    }
};
