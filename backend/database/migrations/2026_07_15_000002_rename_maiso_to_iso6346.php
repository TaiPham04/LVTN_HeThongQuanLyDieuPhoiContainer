<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    private array $map = [
        '20DC' => '22G1',
        '40DC' => '42G1',
        '40HC' => '45G1',
        '45HC' => 'L5G1',
        '20RF' => '22R1',
        '40RF' => '42R1',
        '40RH' => '45R1',  // duplicate nếu maloai 5 đã là 45R1 → xóa
        '20OT' => '22U1',
        '40OT' => '42U1',
        '20FR' => '22P1',
        '40FR' => '42P1',
        '20PF' => '22P3',
        '40PF' => '42P3',
        'TK20' => '22T3',
        '20VH' => '22V0',
    ];

    public function up(): void
    {
        foreach ($this->map as $old => $new) {
            $oldRow = DB::table('loaicontainer')->where('maiso', $old)->first();
            if (!$oldRow) continue; // đã đổi hoặc không tồn tại

            if (DB::table('loaicontainer')->where('maiso', $new)->exists()) {
                // Target đã tồn tại — $old là bản ghi trùng, redirect FK rồi xóa
                $newRow = DB::table('loaicontainer')->where('maiso', $new)->first();
                DB::table('container')->where('maloai', $oldRow->maloai)->update(['maloai' => $newRow->maloai]);
                DB::table('loaicontainer')->where('maloai', $oldRow->maloai)->delete();
            } else {
                DB::table('loaicontainer')->where('maiso', $old)->update(['maiso' => $new]);
            }
        }
    }

    public function down(): void
    {
        foreach ($this->map as $old => $new) {
            DB::table('loaicontainer')->where('maiso', $new)->update(['maiso' => $old]);
        }
    }
};
