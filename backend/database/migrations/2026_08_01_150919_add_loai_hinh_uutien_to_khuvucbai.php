<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->enum('loai_hinh_uutien', ['nhap', 'xuat', 'ca_hai'])
                  ->after('loai_nhom')
                  ->default('ca_hai');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->dropColumn('loai_hinh_uutien');
        });
    }
};
