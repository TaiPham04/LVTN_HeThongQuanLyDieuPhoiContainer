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
                'maiso'          => '20OT',
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
                'maiso'          => '40OT',
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
                'maiso'          => '20FR',
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
                'maiso'          => '40FR',
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
                'maiso'          => '20PF',
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
                'maiso'          => '40PF',
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
                'maiso'          => 'TK20',
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
                'maiso'          => '20VH',
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
                'maiso'          => '40RH',
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
                'maiso'          => '45HC',
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

        $maloaiMap = []; // ['maiso' => maloai]

        foreach ($loaiMoi as $row) {
            $existing = DB::table('loaicontainer')->where('maiso', $row['maiso'])->first();
            if (!$existing) {
                $id = DB::table('loaicontainer')->insertGetId(
                    array_merge($row, ['created_at' => $now, 'updated_at' => $now])
                );
                $maloaiMap[$row['maiso']] = $id;
            } else {
                $maloaiMap[$row['maiso']] = $existing->maloai;
            }
        }

        // ── 2. Block hàng nguy hiểm (Block G) ─────────────────────────
        $blockG = DB::table('khuvucbai')->where('tenblock', 'G')->first();
        if (!$blockG) {
            $makhuvucG = DB::table('khuvucbai')->insertGetId([
                'tenblock'         => 'G',
                'sokhoang'         => 5,
                'sohang'           => 3,
                'sotang'           => 1,    // hàng nguy hiểm chỉ 1 tầng
                'lablock_lanh'     => false,
                'lablock_hangnguy' => true,
                'soocamlanh'       => 0,
                'trangthai'        => 'hoatdong',
                'created_at'       => $now,
                'updated_at'       => $now,
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
                ->update(['lablock_hangnguy' => true, 'updated_at' => $now]);
        }

        // ── 3. Pivot loaicontainer_khuvuc cho loại mới ─────────────────
        $blocks = DB::table('khuvucbai')
            ->whereIn('tenblock', ['A', 'B', 'C', 'D', 'F', 'G'])
            ->pluck('makhuvuc', 'tenblock')
            ->toArray();

        // Loại đặt ở block thường (A, B, D, F): OT, FR, PF, VH, 45HC
        $loaiChoBlockThuong = array_filter($maloaiMap, fn($maiso) => in_array($maiso, ['20OT', '40OT', '20FR', '40FR', '20PF', '40PF', '20VH', '45HC']), ARRAY_FILTER_USE_KEY);
        $blockThuongIds     = array_filter($blocks, fn($ten) => in_array($ten, ['A', 'B', 'D', 'F']), ARRAY_FILTER_USE_KEY);

        foreach ($loaiChoBlockThuong as $maiso => $maloai) {
            foreach ($blockThuongIds as $makhuvuc) {
                DB::table('loaicontainer_khuvuc')->insertOrIgnore([
                    'maloai'    => $maloai,
                    'makhuvuc'  => $makhuvuc,
                ]);
            }
        }

        // Loại lạnh (40RH) → Block C
        if (isset($maloaiMap['40RH']) && isset($blocks['C'])) {
            DB::table('loaicontainer_khuvuc')->insertOrIgnore([
                'maloai'   => $maloaiMap['40RH'],
                'makhuvuc' => $blocks['C'],
            ]);
        }

        // Loại hàng nguy hiểm (TK20) → Block G
        if (isset($maloaiMap['TK20'])) {
            DB::table('loaicontainer_khuvuc')->insertOrIgnore([
                'maloai'   => $maloaiMap['TK20'],
                'makhuvuc' => $makhuvucG,
            ]);
        }
    }
}
