<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            if (Schema::hasColumn('taixe', 'matkhau')) {
                $table->dropColumn('matkhau');
            }
            if (Schema::hasColumn('taixe', 'email')) {
                $table->dropColumn('email');
            }
        });
    }

    public function down(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->string('email', 100)->nullable();
            $table->string('matkhau')->nullable();
        });
    }
};
