<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ── 1. Chuyến tàu (thêm 5) ─────────────────────────────────
        DB::table('chuyentau')->insert([
            [
                'mahangtau' => 1, 'tentau' => 'Maersk Sentosa', 'sovoyage' => 'MAE001E',
                'cangxuatphat' => 'CNSHA', 'cangdich' => 'VNCLI',
                'thoigiandukien' => '2026-06-10 08:00:00', 'thoigianroiben' => '2026-06-12 18:00:00',
                'socontainerdukien' => 120, 'trangthai' => 'dalenlich',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'mahangtau' => 2, 'tentau' => 'MSC Ambra', 'sovoyage' => 'MSC001N',
                'cangxuatphat' => 'SGSIN', 'cangdich' => 'VNCLI',
                'thoigiandukien' => '2026-06-09 14:00:00', 'thoigianroiben' => '2026-06-11 20:00:00',
                'socontainerdukien' => 200, 'trangthai' => 'dadencang',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'mahangtau' => 3, 'tentau' => 'COSCO Star', 'sovoyage' => 'COS001W',
                'cangxuatphat' => 'JPNGO', 'cangdich' => 'VNCLI',
                'thoigiandukien' => '2026-06-08 06:00:00', 'thoigianroiben' => '2026-06-10 12:00:00',
                'socontainerdukien' => 150, 'trangthai' => 'dadencang',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'mahangtau' => 4, 'tentau' => 'Ever Fortune', 'sovoyage' => 'EVG001S',
                'cangxuatphat' => 'VNHPH', 'cangdich' => 'SGSIN',
                'thoigiandukien' => '2026-06-15 10:00:00', 'thoigianroiben' => '2026-06-17 22:00:00',
                'socontainerdukien' => 80, 'trangthai' => 'dalenlich',
                'created_at' => $now, 'updated_at' => $now,
            ],
            [
                'mahangtau' => 5, 'tentau' => 'Hapag Precision', 'sovoyage' => 'HAP001E',
                'cangxuatphat' => 'CNXMN', 'cangdich' => 'VNCLI',
                'thoigiandukien' => '2026-06-20 09:00:00', 'thoigianroiben' => '2026-06-22 16:00:00',
                'socontainerdukien' => 300, 'trangthai' => 'dalenlich',
                'created_at' => $now, 'updated_at' => $now,
            ],
        ]);

        // ── 2. Tài xế (5 người) — mỗi tài xế cần 1 taikhoan (mavaitro=4) ─
        $taiXeDefs = [
            ['hoten' => 'Trần Văn Bình',    'sodienthoai' => '0901234567', 'email' => 'binhvantran@driver.com'],
            ['hoten' => 'Lê Hoàng Nam',     'sodienthoai' => '0912345678', 'email' => 'namlehoang@driver.com'],
            ['hoten' => 'Phạm Thị Lan',     'sodienthoai' => '0923456789', 'email' => 'lanphamthi@driver.com'],
            ['hoten' => 'Nguyễn Minh Tuấn', 'sodienthoai' => '0934567890', 'email' => 'tuannguyenminh@driver.com'],
            ['hoten' => 'Võ Văn Dũng',      'sodienthoai' => '0945678901', 'email' => 'dungvovan@driver.com'],
        ];

        foreach ($taiXeDefs as $tx) {
            $mataikhoan = DB::table('taikhoan')->insertGetId([
                'mavaitro'    => 4,
                'hoten'       => $tx['hoten'],
                'email'       => $tx['email'],
                'matkhau'     => Hash::make('123456'),
                'sodienthoai' => $tx['sodienthoai'],
                'trangthai'   => 'hoatdong',
                'created_at'  => $now, 'updated_at' => $now,
            ]);

            DB::table('taixe')->insert([
                'mataikhoan'  => $mataikhoan,
                'makhachhang' => 3,
                'hoten'       => $tx['hoten'],
                'sodienthoai' => $tx['sodienthoai'],
                'trangthai'   => 'hoatdong',
                'created_at'  => $now, 'updated_at' => $now,
            ]);
        }

        // ── 3. Ô bãi cho Block A, B, C, D ───────────────────────────
        $blockDefs = [
            ['makhuvuc' => 1, 'tenblock' => 'A', 'sokhoang' => 10, 'sohang' => 6, 'sotang' => 4],
            ['makhuvuc' => 2, 'tenblock' => 'B', 'sokhoang' => 10, 'sohang' => 6, 'sotang' => 4],
            ['makhuvuc' => 3, 'tenblock' => 'C', 'sokhoang' => 8,  'sohang' => 4, 'sotang' => 3],
            ['makhuvuc' => 4, 'tenblock' => 'D', 'sokhoang' => 8,  'sohang' => 4, 'sotang' => 4],
        ];
        $obaiData = [];
        foreach ($blockDefs as $b) {
            for ($k = 1; $k <= $b['sokhoang']; $k++) {
                for ($h = 1; $h <= $b['sohang']; $h++) {
                    for ($t = 1; $t <= $b['sotang']; $t++) {
                        $obaiData[] = [
                            'makhuvuc'    => $b['makhuvuc'],
                            'khoang'      => $k,
                            'hang'        => $h,
                            'tang'        => $t,
                            'maobai_code' => $b['tenblock'] . '-' . sprintf('%02d', $k) . '-' . $h . '-' . $t,
                            'trangthai'   => 'trong',
                            'created_at'  => $now,
                            'updated_at'  => $now,
                        ];
                    }
                }
            }
        }
        DB::table('obai')->insert($obaiData);

        // ── 4. Lịch sử vị trí — gán container trongbai vào Block F ─
        // Block F (makhuvuc=5) đã có 160 ô, lấy 10 ô đầu
        $obaiF = DB::table('obai')
            ->where('makhuvuc', 5)
            ->orderBy('maobai')
            ->limit(10)
            ->pluck('maobai')
            ->toArray();

        // 10 container đang trong bãi
        $trongBaiIds = [1, 2, 5, 6, 9, 10, 13, 14, 17, 19];
        $lichsuData  = [];

        foreach ($trongBaiIds as $idx => $macontainer) {
            $maobai  = $obaiF[$idx];
            $vaobai  = $now->copy()->subDays(rand(3, 30));

            $lichsuData[] = [
                'macontainer'    => $macontainer,
                'maobai'         => $maobai,
                'manhanvien'     => 2,
                'thoigian_gan'   => $vaobai->format('Y-m-d H:i:s'),
                'thoigian_roi'   => null,
                'kieudichchuyen' => 'bandau',
                'ghichu'         => null,
                'created_at'     => $now,
                'updated_at'     => $now,
            ];

            DB::table('obai')->where('maobai', $maobai)
                ->update(['trangthai' => 'dangsudung', 'updated_at' => $now]);

            DB::table('container')->where('macontainer', $macontainer)
                ->update(['thoigian_vaobai' => $vaobai->format('Y-m-d H:i:s'), 'updated_at' => $now]);
        }
        DB::table('lichsuvitri')->insert($lichsuData);

        // Gán thoigian_rabai cho containers đã xuất cổng (3, 7, 15)
        foreach ([3 => 5, 7 => 3, 15 => 2] as $macontainer => $daysAgo) {
            DB::table('container')->where('macontainer', $macontainer)->update([
                'thoigian_vaobai' => $now->copy()->subDays($daysAgo + 10)->format('Y-m-d H:i:s'),
                'thoigian_rabai'  => $now->copy()->subDays($daysAgo)->format('Y-m-d H:i:s'),
                'updated_at'      => $now,
            ]);
        }

        // ── 5. Log cổng xuất nhập ──────────────────────────────────
        $taixeIds = DB::table('taixe')->orderBy('mataixe')->limit(5)->pluck('mataixe')->toArray();

        DB::table('logcong')->insert([
            // Nhập bãi
            ['macontainer' => 1,  'machuyentau' => null, 'mataixe' => $taixeIds[0], 'manhanvien' => 2, 'kieu_xuatnhap' => 'nhap', 'biensoxe' => '51B-10001', 'niemchi_ktra' => 'NC00000001', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(20)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 2,  'machuyentau' => null, 'mataixe' => $taixeIds[1], 'manhanvien' => 2, 'kieu_xuatnhap' => 'nhap', 'biensoxe' => '51B-10002', 'niemchi_ktra' => 'NC00000002', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(18)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 5,  'machuyentau' => null, 'mataixe' => $taixeIds[2], 'manhanvien' => 2, 'kieu_xuatnhap' => 'nhap', 'biensoxe' => '51C-20001', 'niemchi_ktra' => 'NC00000005', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(15)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 9,  'machuyentau' => null, 'mataixe' => $taixeIds[3], 'manhanvien' => 2, 'kieu_xuatnhap' => 'nhap', 'biensoxe' => '51D-30001', 'niemchi_ktra' => 'NC00000009', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(10)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 13, 'machuyentau' => null, 'mataixe' => $taixeIds[4], 'manhanvien' => 2, 'kieu_xuatnhap' => 'nhap', 'biensoxe' => '51B-40001', 'niemchi_ktra' => 'NC00000013', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(8)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 17, 'machuyentau' => null, 'mataixe' => $taixeIds[0], 'manhanvien' => 2, 'kieu_xuatnhap' => 'nhap', 'biensoxe' => '51B-50001', 'niemchi_ktra' => 'NC00000017', 'niemchi_ok' => 0, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(5)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            // Xuất cổng
            ['macontainer' => 3,  'machuyentau' => null, 'mataixe' => $taixeIds[1], 'manhanvien' => 2, 'kieu_xuatnhap' => 'xuat', 'biensoxe' => '51B-60001', 'niemchi_ktra' => 'NC00000003', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(5)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 7,  'machuyentau' => null, 'mataixe' => $taixeIds[2], 'manhanvien' => 2, 'kieu_xuatnhap' => 'xuat', 'biensoxe' => '51C-70001', 'niemchi_ktra' => 'NC00000007', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(3)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 15, 'machuyentau' => null, 'mataixe' => $taixeIds[3], 'manhanvien' => 2, 'kieu_xuatnhap' => 'xuat', 'biensoxe' => '51D-80001', 'niemchi_ktra' => 'NC00000015', 'niemchi_ok' => 1, 'haiquan_ok' => 1, 'thoigian_xl' => $now->copy()->subDays(2)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
        ]);

        // ── 6. Biên bản kiểm tra định kỳ ──────────────────────────
        DB::table('bienbanktd')->insert([
            ['macontainer' => 17, 'manhanvien' => 2, 'loaiktd' => 'nhapbai',  'ketqua_ktd' => 'Phát hiện móp góc phải hông, vết lõm ~5cm', 'bi_hong' => 1, 'ketluan' => 'khongdat', 'thoigian_ktd' => $now->copy()->subDays(5)->format('Y-m-d H:i:s'),  'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 1,  'manhanvien' => 2, 'loaiktd' => 'nhapbai',  'ketqua_ktd' => 'Tình trạng tốt, không có hư hỏng',           'bi_hong' => 0, 'ketluan' => 'datieu',    'thoigian_ktd' => $now->copy()->subDays(20)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 5,  'manhanvien' => 2, 'loaiktd' => 'nhapbai',  'ketqua_ktd' => 'Tình trạng tốt',                              'bi_hong' => 0, 'ketluan' => 'datieu',    'thoigian_ktd' => $now->copy()->subDays(15)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 9,  'manhanvien' => 2, 'loaiktd' => 'thamdinh', 'ketqua_ktd' => 'Vết trầy xước nhỏ bề mặt, không ảnh hưởng',  'bi_hong' => 0, 'ketluan' => 'datieu',    'thoigian_ktd' => $now->copy()->subDays(10)->format('Y-m-d H:i:s'), 'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 3,  'manhanvien' => 2, 'loaiktd' => 'xuatbai',  'ketqua_ktd' => 'Tình trạng tốt sau lưu bãi',                  'bi_hong' => 0, 'ketluan' => 'datieu',    'thoigian_ktd' => $now->copy()->subDays(5)->format('Y-m-d H:i:s'),  'created_at' => $now, 'updated_at' => $now],
            ['macontainer' => 15, 'manhanvien' => 2, 'loaiktd' => 'xuatbai',  'ketqua_ktd' => 'Tình trạng tốt',                              'bi_hong' => 0, 'ketluan' => 'datieu',    'thoigian_ktd' => $now->copy()->subDays(2)->format('Y-m-d H:i:s'),  'created_at' => $now, 'updated_at' => $now],
        ]);
    }
}
