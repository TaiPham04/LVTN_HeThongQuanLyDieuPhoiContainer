<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Thêm loai_hinh (mặc định xuat cho dữ liệu cũ)
        if (!Schema::hasColumn('container', 'loai_hinh')) {
            Schema::table('container', function (Blueprint $table) {
                $table->enum('loai_hinh', ['nhap', 'xuat'])->default('xuat')->after('makhachhang');
            });
        }

        // 2. Sửa trangthai_haiquan: thêm giá trị chua_khai, đổi default
        DB::statement("ALTER TABLE `container`
            MODIFY COLUMN `trangthai_haiquan`
            ENUM('chua_khai','luong_xanh','luong_vang','luong_do')
            NOT NULL DEFAULT 'chua_khai'");

        // 3. Cập nhật các bản ghi có trangthai_haiquan rỗng → chua_khai
        DB::table('container')->where('trangthai_haiquan', '')->update(['trangthai_haiquan' => 'chua_khai']);

        // 4. Xoá container không có chuyến tàu (không hợp lệ theo nghiệp vụ mới)
        DB::table('container')->whereNull('machuyentau')->delete();

        // 5. Gán mahangtau cho machuyentau đang null an toàn (phòng trường hợp xoá mềm còn sót)
        // (đã xoá ở bước 4, bước này chỉ là safeguard)

        // 6. Xoá FK và column mahangtau (FK tên tuỳ chỉnh: fk_cont_ht)
        if (Schema::hasColumn('container', 'mahangtau')) {
            DB::statement('ALTER TABLE `container` DROP FOREIGN KEY `fk_cont_ht`');
            Schema::table('container', function (Blueprint $table) {
                $table->dropColumn('mahangtau');
            });
        }

        // 7. machuyentau NOT NULL — FK cũ có ON DELETE SET NULL nên phải drop & recreate
        DB::statement('ALTER TABLE `container` DROP FOREIGN KEY `fk_cont_ct`');
        DB::statement('ALTER TABLE `container` MODIFY COLUMN `machuyentau` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `container` ADD CONSTRAINT `fk_cont_ct` FOREIGN KEY (`machuyentau`) REFERENCES `chuyentau`(`machuyentau`)');
    }

    public function down(): void
    {
        // Thêm lại mahangtau (nullable tạm để restore dữ liệu)
        Schema::table('container', function (Blueprint $table) {
            $table->unsignedBigInteger('mahangtau')->nullable()->after('maloai');
        });

        // Populate mahangtau từ chuyentau
        DB::statement("UPDATE `container` c
            JOIN `chuyentau` ct ON c.machuyentau = ct.machuyentau
            SET c.mahangtau = ct.mahangtau");

        // Đặt NOT NULL và FK
        Schema::table('container', function (Blueprint $table) {
            $table->unsignedBigInteger('mahangtau')->nullable(false)->change();
            $table->foreign('mahangtau')->references('mahangtau')->on('hangtau');
        });

        // Rollback trangthai_haiquan ENUM
        DB::statement("ALTER TABLE `container`
            MODIFY COLUMN `trangthai_haiquan`
            ENUM('luong_xanh','luong_vang','luong_do')
            NOT NULL DEFAULT 'luong_vang'");

        // machuyentau trở lại nullable
        Schema::table('container', function (Blueprint $table) {
            $table->unsignedBigInteger('machuyentau')->nullable()->change();
        });

        // Xoá loai_hinh
        Schema::table('container', function (Blueprint $table) {
            $table->dropColumn('loai_hinh');
        });
    }
};
