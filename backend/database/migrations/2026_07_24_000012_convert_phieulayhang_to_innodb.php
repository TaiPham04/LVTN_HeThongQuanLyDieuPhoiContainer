<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // phieulayhang là bảng nghiệp vụ duy nhất chạy MyISAM — engine này không hỗ
        // trợ ràng buộc khóa ngoại, nên macontainer/mataixe/manhanvien chưa từng được
        // CSDL kiểm soát thật dù có index tên *_foreign. Chuyển sang InnoDB để migration
        // sau có thể gắn FK thật cho manhanvien.
        DB::statement('ALTER TABLE phieulayhang ENGINE=InnoDB');
    }

    public function down(): void
    {
        // Không hỗ trợ revert về MyISAM một cách có ý nghĩa sau khi đã gắn FK thật
        // ở migration kế tiếp — MyISAM không giữ được ràng buộc đó.
    }
};
