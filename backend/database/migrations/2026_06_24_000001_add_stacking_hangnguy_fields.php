<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Thêm 2 field kiểm soát xếp chồng vào bảng loaicontainer
        Schema::table('loaicontainer', function (Blueprint $table) {
            // Container có cho phép xếp chồng lên trên không (Open Top, Flat Rack, Tank = false)
            $table->boolean('cho_phep_xep_chong')->default(true)->after('lahangnguy');
            // Tầng tối đa container này được đặt (null = không giới hạn, 1 = chỉ tầng 1)
            $table->unsignedTinyInteger('tang_toi_da')->nullable()->after('cho_phep_xep_chong');
        });

        // Thêm field khu vực hàng nguy hiểm vào bảng khuvucbai
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->boolean('lablock_hangnguy')->default(false)->after('lablock_lanh');
        });
    }

    public function down(): void
    {
        Schema::table('loaicontainer', function (Blueprint $table) {
            $table->dropColumn(['cho_phep_xep_chong', 'tang_toi_da']);
        });

        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->dropColumn('lablock_hangnguy');
        });
    }
};
