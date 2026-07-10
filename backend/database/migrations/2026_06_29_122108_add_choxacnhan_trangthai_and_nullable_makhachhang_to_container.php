<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE container MODIFY COLUMN trangthai ENUM('choxacnhan','dangky','trongbai','xuatcong','dalenken','khonghoatdong') NOT NULL DEFAULT 'dangky'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE container MODIFY COLUMN trangthai ENUM('dangky','trongbai','xuatcong','dalenken','khonghoatdong') NOT NULL DEFAULT 'dangky'");
    }
};
