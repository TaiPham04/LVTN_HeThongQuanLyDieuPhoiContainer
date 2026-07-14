<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->renameColumn('taithong_kg', 'taitrong_kg');
        });
    }

    public function down(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->renameColumn('taitrong_kg', 'taithong_kg');
        });
    }
};
