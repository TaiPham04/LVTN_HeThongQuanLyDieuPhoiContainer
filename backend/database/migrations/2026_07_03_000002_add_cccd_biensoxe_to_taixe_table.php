<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            if (!Schema::hasColumn('taixe', 'cccd')) {
                $table->string('cccd', 20)->nullable()->unique()->after('sodienthoai');
            }
            if (!Schema::hasColumn('taixe', 'biensoxe')) {
                $table->string('biensoxe', 20)->nullable()->after('cccd');
            }
        });
    }

    public function down(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->dropColumn(['cccd', 'biensoxe']);
        });
    }
};
