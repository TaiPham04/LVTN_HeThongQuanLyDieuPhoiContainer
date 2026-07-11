<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->string('bienso_romo', 20)->nullable()->after('biensoxe');
            $table->time('eta_tu')->nullable()->after('thoigian_den_cang');
            $table->time('eta_den')->nullable()->after('eta_tu');
        });
    }

    public function down(): void
    {
        Schema::table('phieulayhang', function (Blueprint $table) {
            $table->dropColumn(['bienso_romo', 'eta_tu', 'eta_den']);
        });
    }
};
