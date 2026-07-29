<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Thêm các loại container thực tế còn thiếu và block hàng nguy hiểm.
 * Seeder này an toàn để chạy nhiều lần (dùng firstOrCreate / insertOrIgnore).
 */
class LoaiContainerMoiSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ── 1. Loại container mới ──────────────────────────────────────
        $loaiMoi = [
            // ── Open Top ──────────────────────────────────────────────
            [
                'maiso'          => '22U1',
                'nhom'           => 'open_top',
                'tenloai'        => 'Open Top 20ft',
                'chieudai_ft'    => 20.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 8.5,
                'taitrong_kg'    => 21770,
                'gialuubai_ngay' => 150000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            [
                'maiso'          => '42U1',
                'nhom'           => 'open_top',
                'tenloai'        => 'Open Top 40ft',
                'chieudai_ft'    => 40.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 8.5,
                'taitrong_kg'    => 26300,
                'gialuubai_ngay' => 200000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            // ── Flat Rack ─────────────────────────────────────────────
            [
                'maiso'          => '22P1',
                'nhom'           => 'flat_rack',
                'tenloai'        => 'Flat Rack 20ft',
                'chieudai_ft'    => 20.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 8.5,
                'taitrong_kg'    => 27900,
                'gialuubai_ngay' => 180000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            [
                'maiso'          => '42P1',
                'nhom'           => 'flat_rack',
                'tenloai'        => 'Flat Rack 40ft',
                'chieudai_ft'    => 40.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 8.5,
                'taitrong_kg'    => 39700,
                'gialuubai_ngay' => 250000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            // ── Platform ──────────────────────────────────────────────
            [
                'maiso'          => '22P3',
                'nhom'           => 'platform',
                'tenloai'        => 'Platform 20ft',
                'chieudai_ft'    => 20.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 1.5,
                'taitrong_kg'    => 29000,
                'gialuubai_ngay' => 180000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            [
                'maiso'          => '42P3',
                'nhom'           => 'platform',
                'tenloai'        => 'Platform 40ft',
                'chieudai_ft'    => 40.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 1.5,
                'taitrong_kg'    => 40000,
                'gialuubai_ngay' => 250000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            // ── ISO Tank (hàng nguy hiểm) ─────────────────────────────
            [
                'maiso'          => '22T3',
                'nhom'           => 'hazmat',
                'tenloai'        => 'ISO Tank 20ft',
                'chieudai_ft'    => 20.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 8.5,
                'taitrong_kg'    => 21000,
                'gialuubai_ngay' => 300000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            // ── Ventilated (thông gió) ────────────────────────────────
            [
                'maiso'          => '22V0',
                'nhom'           => 'ventilated',
                'tenloai'        => 'Ventilated 20ft',
                'chieudai_ft'    => 20.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 8.5,
                'taitrong_kg'    => 21600,
                'gialuubai_ngay' => 120000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            // ── Reefer High Cube ──────────────────────────────────────
            [
                'maiso'          => '45R1',
                'nhom'           => 'reefer',
                'tenloai'        => 'Reefer HC 40ft',
                'chieudai_ft'    => 40.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 9.5,
                'taitrong_kg'    => 25400,
                'gialuubai_ngay' => 500000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
            // ── 45ft High Cube ────────────────────────────────────────
            [
                'maiso'          => 'L5G1',
                'nhom'           => 'dry',
                'tenloai'        => 'Dry HC 45ft',
                'chieudai_ft'    => 45.0,
                'chieurong_ft'   => 8.0,
                'chieucao_ft'    => 9.5,
                'taitrong_kg'    => 29500,
                'gialuubai_ngay' => 220000,
                'soNgayMienPhi'  => 3,
                'trangthai'      => 'hoatdong',
            ],
        ];

        foreach ($loaiMoi as $row) {
            $existing = DB::table('loaicontainer')->where('maiso', $row['maiso'])->exists();
            if (!$existing) {
                DB::table('loaicontainer')->insert(
                    array_merge($row, ['created_at' => $now, 'updated_at' => $now])
                );
            }
        }

        // ── 2. Block hàng nguy hiểm (Block G) ─────────────────────────
        $blockG = DB::table('khuvucbai')->where('tenblock', 'G')->first();
        if (!$blockG) {
            $makhuvucG = DB::table('khuvucbai')->insertGetId([
                'tenblock'  => 'G',
                'sokhoang'  => 5,
                'sohang'    => 3,
                'sotang'    => 1,
                'loai_nhom' => 'hazmat',
                'trangthai' => 'hoatdong',
                'created_at' => $now,
                'updated_at' => $now,
            ]);

            // Tạo ô bãi cho Block G (5 khoang × 3 hàng × 1 tầng = 15 ô)
            $obaiG = [];
            for ($k = 1; $k <= 5; $k++) {
                for ($h = 1; $h <= 3; $h++) {
                    $obaiG[] = [
                        'makhuvuc'    => $makhuvucG,
                        'khoang'      => $k,
                        'hang'        => $h,
                        'tang'        => 1,
                        'maobai_code' => 'G-' . sprintf('%02d', $k) . '-' . $h . '-1',
                        'trangthai'   => 'trong',
                        'created_at'  => $now,
                        'updated_at'  => $now,
                    ];
                }
            }
            DB::table('obai')->insert($obaiG);
        } else {
            $makhuvucG = $blockG->makhuvuc;
            DB::table('khuvucbai')->where('makhuvuc', $makhuvucG)
                ->update(['updated_at' => $now]);
        }
    }
}
