<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->dropColumn('sobanglai');
        });
    }

    public function down(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->string('sobanglai', 20)->nullable()->after('cccd');
        });
    }
};
