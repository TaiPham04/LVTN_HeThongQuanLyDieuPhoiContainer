<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('loaicontainer_khuvuc');
    }

    public function down(): void
    {
        Schema::create('loaicontainer_khuvuc', function (Blueprint $table) {
            $table->unsignedBigInteger('maloai');
            $table->unsignedBigInteger('makhuvuc');
            $table->primary(['maloai', 'makhuvuc']);
        });
    }
};
