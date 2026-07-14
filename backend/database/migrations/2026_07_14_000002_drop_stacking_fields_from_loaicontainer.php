<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->dropColumn(['cho_phep_xep_chong', 'tang_toi_da']);
        });
    }

    public function down(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->boolean('cho_phep_xep_chong')->default(true)->after('lahangnguy');
            $table->unsignedTinyInteger('tang_toi_da')->nullable()->after('cho_phep_xep_chong');
        });
    }
};
