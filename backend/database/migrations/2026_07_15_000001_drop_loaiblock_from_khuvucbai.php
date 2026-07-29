<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->dropColumn('loaiblock');
        });
    }

    public function down(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->enum('loaiblock', ['thuong', 'lanh', 'hangnguy'])->default('thuong')->after('sotang');
        });
    }
};
