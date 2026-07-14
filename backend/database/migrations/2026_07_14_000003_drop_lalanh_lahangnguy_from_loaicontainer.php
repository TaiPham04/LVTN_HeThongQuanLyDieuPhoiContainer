<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->dropColumn(['lalanh', 'lahangnguy']);
        });
    }

    public function down(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->boolean('lalanh')->default(false)->after('taitrong_kg');
            $table->boolean('lahangnguy')->default(false)->after('lalanh');
        });
    }
};
