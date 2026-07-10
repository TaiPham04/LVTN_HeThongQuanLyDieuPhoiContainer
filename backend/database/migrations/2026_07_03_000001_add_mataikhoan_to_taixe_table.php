<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->unsignedBigInteger('mataikhoan')->nullable()->unique()->after('mataixe');
            $table->foreign('mataikhoan')->references('mataikhoan')->on('taikhoan')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('taixe', function (Blueprint $table) {
            $table->dropForeign(['mataikhoan']);
            $table->dropColumn('mataikhoan');
        });
    }
};
