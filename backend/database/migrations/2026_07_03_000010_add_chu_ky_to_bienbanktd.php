<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->string('chu_ky', 20)->nullable()->after('loaiktd');
        });
    }

    public function down(): void
    {
        Schema::table('bienbanktd', function (Blueprint $table) {
            $table->dropColumn('chu_ky');
        });
    }
};
