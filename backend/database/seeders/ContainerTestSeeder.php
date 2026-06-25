<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * 20 container test đủ loại: Dry, Reefer, Open Top, Flat Rack,
 * Platform, ISO Tank, Ventilated, 45HC — với nhiều trạng thái khác nhau.
 *
 * An toàn chạy lại nhiều lần (bỏ qua nếu socontainer đã tồn tại).
 *
 * maiso → maloai hiện tại:
 *   22G1=1  42G1=2  45G1=3  22R1=4  45R1=5
 *   20OT=6  40OT=7  20FR=8  40FR=9  20PF=10
 *   40PF=11 TK20=12 20VH=13 40RH=14 45HC=15
 *
 * chuyentau: 7=MAE001E(ht1) 8=MSC001N(ht2) 9=COS001W(ht3)
 *            10=EVG001S(ht4) 11=HAP001E(ht5)
 */
class ContainerTestSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $containers = [
            // ── 1. Dry 20ft — đăng ký, chờ nhập bãi ─────────────────
            [
                'socontainer'       => 'MAEU1000001',
                'maloai'            => 1,
                'mahangtau'         => 1,
                'machuyentau'       => 7,       // MAE001E
                'soniemchi'         => 'NC-M001',
                'trongluong_kg'     => 18500.00,
                'mota_hanghoa'      => 'Hàng điện tử',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 2. Dry 40ft — đang trong bãi, thông quan xanh ────────
            [
                'socontainer'       => 'MSCU2000001',
                'maloai'            => 2,
                'mahangtau'         => 2,
                'machuyentau'       => 8,       // MSC001N
                'soniemchi'         => 'NC-S001',
                'trongluong_kg'     => 24000.00,
                'mota_hanghoa'      => 'Máy móc thiết bị',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(7)->toDateTimeString(),
            ],
            // ── 3. Dry 40HC — đăng ký ────────────────────────────────
            [
                'socontainer'       => 'COSU3000001',
                'maloai'            => 3,
                'mahangtau'         => 3,
                'machuyentau'       => 9,       // COS001W
                'soniemchi'         => 'NC-C001',
                'trongluong_kg'     => 26000.00,
                'mota_hanghoa'      => 'Hàng dệt may',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 4. Reefer 20ft — đăng ký ─────────────────────────────
            [
                'socontainer'       => 'EVGU4000001',
                'maloai'            => 4,
                'mahangtau'         => 4,
                'machuyentau'       => 10,      // EVG001S
                'soniemchi'         => 'NC-E001',
                'trongluong_kg'     => 15000.00,
                'mota_hanghoa'      => 'Thực phẩm đông lạnh',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 5. Reefer 40ft HC — trong bãi, thông quan xanh ───────
            [
                'socontainer'       => 'HLCU5000001',
                'maloai'            => 5,
                'mahangtau'         => 5,
                'machuyentau'       => 11,      // HAP001E
                'soniemchi'         => 'NC-H001',
                'trongluong_kg'     => 20000.00,
                'mota_hanghoa'      => 'Hải sản đông lạnh',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(5)->toDateTimeString(),
            ],
            // ── 6. Open Top 20ft — đăng ký ───────────────────────────
            [
                'socontainer'       => 'MAEU1000002',
                'maloai'            => 6,
                'mahangtau'         => 1,
                'machuyentau'       => 7,
                'soniemchi'         => 'NC-M002',
                'trongluong_kg'     => 19000.00,
                'mota_hanghoa'      => 'Máy xây dựng cồng kềnh',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 7. Open Top 40ft — trong bãi, hải quan vàng (chờ KT) ─
            [
                'socontainer'       => 'MSCU2000002',
                'maloai'            => 7,
                'mahangtau'         => 2,
                'machuyentau'       => 8,
                'soniemchi'         => 'NC-S002',
                'trongluong_kg'     => 22000.00,
                'mota_hanghoa'      => 'Thiết bị công nghiệp lớn',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(3)->toDateTimeString(),
            ],
            // ── 8. Flat Rack 20ft — đăng ký ──────────────────────────
            [
                'socontainer'       => 'COSU3000002',
                'maloai'            => 8,
                'mahangtau'         => 3,
                'machuyentau'       => 9,
                'soniemchi'         => null,
                'trongluong_kg'     => 24000.00,
                'mota_hanghoa'      => 'Xe tải hạng nặng',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 9. Flat Rack 40ft — trong bãi, thông quan xanh ───────
            [
                'socontainer'       => 'EVGU4000002',
                'maloai'            => 9,
                'mahangtau'         => 4,
                'machuyentau'       => 10,
                'soniemchi'         => null,
                'trongluong_kg'     => 35000.00,
                'mota_hanghoa'      => 'Thiết bị điện gió',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(6)->toDateTimeString(),
            ],
            // ── 10. Platform 20ft — đăng ký ──────────────────────────
            [
                'socontainer'       => 'HLCU5000002',
                'maloai'            => 10,
                'mahangtau'         => 5,
                'machuyentau'       => 11,
                'soniemchi'         => null,
                'trongluong_kg'     => 27000.00,
                'mota_hanghoa'      => 'Cấu kiện cầu đường',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 11. Platform 40ft — đăng ký ──────────────────────────
            [
                'socontainer'       => 'MAEU1000003',
                'maloai'            => 11,
                'mahangtau'         => 1,
                'machuyentau'       => null,    // chưa gán chuyến
                'soniemchi'         => null,
                'trongluong_kg'     => 38000.00,
                'mota_hanghoa'      => 'Turbine gió siêu trọng',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 12. ISO Tank (hàng nguy hiểm) — trong bãi, xanh ──────
            [
                'socontainer'       => 'MSCU2000003',
                'maloai'            => 12,
                'mahangtau'         => 2,
                'machuyentau'       => 8,
                'soniemchi'         => 'TK-S001',
                'trongluong_kg'     => 19000.00,
                'mota_hanghoa'      => 'Hóa chất công nghiệp (UN 1993)',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(4)->toDateTimeString(),
            ],
            // ── 13. Ventilated 20ft — đăng ký ────────────────────────
            [
                'socontainer'       => 'COSU3000003',
                'maloai'            => 13,
                'mahangtau'         => 3,
                'machuyentau'       => 9,
                'soniemchi'         => 'NC-C003',
                'trongluong_kg'     => 17000.00,
                'mota_hanghoa'      => 'Cà phê nhân xanh',
                'trangthai'         => 'dangky',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
            ],
            // ── 14. Reefer HC 40ft — trong bãi, hải quan vàng ────────
            [
                'socontainer'       => 'EVGU4000003',
                'maloai'            => 14,
                'mahangtau'         => 4,
                'machuyentau'       => 10,
                'soniemchi'         => 'NC-E003',
                'trongluong_kg'     => 22000.00,
                'mota_hanghoa'      => 'Trái cây tươi nhiệt đới',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(2)->toDateTimeString(),
            ],
            // ── 15. 45HC Dry — trong bãi, thông quan xanh ────────────
            [
                'socontainer'       => 'HLCU5000003',
                'maloai'            => 15,
                'mahangtau'         => 5,
                'machuyentau'       => 11,
                'soniemchi'         => 'NC-H003',
                'trongluong_kg'     => 27000.00,
                'mota_hanghoa'      => 'Đồ nội thất xuất khẩu',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(8)->toDateTimeString(),
            ],
            // ── 16. Dry 20ft — đã xuất cổng ─────────────────────────
            [
                'socontainer'       => 'MAEU1000004',
                'maloai'            => 1,
                'mahangtau'         => 1,
                'machuyentau'       => 7,
                'soniemchi'         => 'NC-M004',
                'trongluong_kg'     => 16000.00,
                'mota_hanghoa'      => 'Linh kiện ô tô',
                'trangthai'         => 'xuatcong',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(15)->toDateTimeString(),
                'thoigian_rabai'    => $now->copy()->subDays(2)->toDateTimeString(),
            ],
            // ── 17. Dry 40ft — trong bãi, hải quan đỏ (tạm giữ) ─────
            [
                'socontainer'       => 'COSU3000004',
                'maloai'            => 2,
                'mahangtau'         => 3,
                'machuyentau'       => null,
                'soniemchi'         => 'NC-C004',
                'trongluong_kg'     => 23000.00,
                'mota_hanghoa'      => 'Hàng hóa chưa khai báo đủ',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_do',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(10)->toDateTimeString(),
            ],
            // ── 18. 40HC — trong bãi, bị hỏng nhẹ, hải quan xanh ────
            [
                'socontainer'       => 'EVGU4000004',
                'maloai'            => 3,
                'mahangtau'         => 4,
                'machuyentau'       => 10,
                'soniemchi'         => 'NC-E004',
                'trongluong_kg'     => 25500.00,
                'mota_hanghoa'      => 'Thiết bị viễn thông',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => true,
                'ghichu_hong'       => 'Méo góc trái phía sau, không ảnh hưởng hàng hóa',
                'thoigian_vaobai'   => $now->copy()->subDays(12)->toDateTimeString(),
            ],
            // ── 19. Open Top 20ft — trong bãi, hải quan vàng ─────────
            [
                'socontainer'       => 'HLCU5000004',
                'maloai'            => 6,
                'mahangtau'         => 5,
                'machuyentau'       => 11,
                'soniemchi'         => null,
                'trongluong_kg'     => 18000.00,
                'mota_hanghoa'      => 'Tấm pin năng lượng mặt trời',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_vang',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(1)->toDateTimeString(),
            ],
            // ── 20. Flat Rack 40ft — trong bãi, thông quan xanh ──────
            [
                'socontainer'       => 'MAEU1000005',
                'maloai'            => 9,
                'mahangtau'         => 1,
                'machuyentau'       => 7,
                'soniemchi'         => null,
                'trongluong_kg'     => 34000.00,
                'mota_hanghoa'      => 'Cẩu trục công trình',
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'luong_xanh',
                'bi_hong'           => false,
                'thoigian_vaobai'   => $now->copy()->subDays(9)->toDateTimeString(),
            ],
        ];

        $inserted = 0;
        $skipped  = 0;

        foreach ($containers as $c) {
            $exists = DB::table('container')
                ->where('socontainer', $c['socontainer'])
                ->whereNull('deleted_at')
                ->exists();

            if ($exists) {
                $skipped++;
                continue;
            }

            DB::table('container')->insert(array_merge($c, [
                'makhachhang' => null,
                'ghichu_hong' => $c['ghichu_hong'] ?? null,
                'deleted_at'  => null,
                'created_at'  => $now,
                'updated_at'  => $now,
            ]));
            $inserted++;
        }

        $this->command->info("ContainerTestSeeder: {$inserted} container đã thêm, {$skipped} bỏ qua (đã tồn tại).");
    }
}
