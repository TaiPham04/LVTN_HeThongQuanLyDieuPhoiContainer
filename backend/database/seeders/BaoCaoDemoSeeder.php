<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

/**
 * Bổ sung dữ liệu cho 5 tab Báo cáo (Xuất/nhập, Container, Hãng tàu,
 * Tồn bãi, KPI) — chỉ THÊM, không đụng tới dữ liệu hiện có.
 *
 * An toàn chạy lại nhiều lần: container sinh ra dùng dải số hiệu riêng
 * (DEMU/RPTU/KPIU + số tăng dần), bỏ qua nếu đã tồn tại.
 */
class BaoCaoDemoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        // ── Dữ liệu tham chiếu thật đang có trong DB ─────────────────
        $chuyenTauHangTau = [7 => 1, 8 => 2, 9 => 3, 10 => 4, 11 => 5, 1 => 6];
        $machuyentauList  = array_keys($chuyenTauHangTau);
        $khachhangIds     = [3, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
        // loại 16 = dữ liệu rác ("123"), loại bỏ khỏi seeder demo
        $loaiIds          = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15];
        $nvCongIds        = [2, 4];
        $taixeIds         = [11];

        $hangHoa = [
            'Hàng điện tử', 'Máy móc thiết bị công nghiệp', 'Hàng dệt may', 'Thực phẩm đông lạnh',
            'Hải sản đông lạnh', 'Linh kiện ô tô', 'Thiết bị viễn thông', 'Đồ nội thất xuất khẩu',
            'Cà phê nhân xanh', 'Trái cây tươi nhiệt đới', 'Hóa chất công nghiệp (UN 1993)',
            'Vật liệu xây dựng', 'Giấy và bột giấy', 'Nhựa nguyên sinh', 'Phụ tùng máy móc',
            'Hàng tiêu dùng nhanh', 'Thiết bị y tế', 'Gạo xuất khẩu', 'Cao su thiên nhiên', 'Giày dép',
        ];

        if ($this->existingDemoCount() > 0) {
            $this->command->warn('BaoCaoDemoSeeder: dữ liệu demo đã tồn tại, bỏ qua để tránh trùng.');
            return;
        }

        $prefixes  = ['DEMU', 'RPTU', 'KPIU', 'TDVU'];
        $counter   = 9000001;
        $nextSo    = function () use (&$counter, $prefixes) {
            $p = $prefixes[$counter % count($prefixes)];
            return $p . str_pad((string) $counter++, 7, '0', STR_PAD_LEFT);
        };

        $dwellBuckets = [[1, 6], [7, 14], [15, 30], [31, 70]];   // ngày
        $ttBuckets    = [[5, 29], [30, 60], [61, 120], [121, 240]]; // phút

        $logRows    = [];
        $phieuRows  = [];
        $inserted   = ['xuatcong' => 0, 'trongbai' => 0, 'logcong' => 0, 'phieu' => 0];

        $pick = fn (array $a) => $a[array_rand($a)];

        $makeContainer = function (string $trangthai, ?Carbon $vaobai, ?Carbon $rabai, $now)
            use ($machuyentauList, $chuyenTauHangTau, $khachhangIds, $loaiIds, $hangHoa, $nextSo, $pick) {

            $machuyentau = $pick($machuyentauList);
            $loaiHinh    = $pick(['nhap', 'xuat']);
            $haiQuanRoll = mt_rand(1, 100);
            $trangthaiHQ = $haiQuanRoll <= 70 ? 'luong_xanh' : ($haiQuanRoll <= 90 ? 'luong_vang' : 'luong_do');
            $daThongQuan = $trangthaiHQ === 'luong_xanh' ? true : (mt_rand(0, 1) === 1);
            $biHong      = mt_rand(1, 100) <= 8;
            $createdAt   = ($vaobai ?? $now)->copy()->subHours(mt_rand(1, 20));

            return [
                'socontainer'       => $nextSo(),
                'maloai'            => $pick($loaiIds),
                'machuyentau'       => $machuyentau,
                'makhachhang'       => $loaiHinh === 'xuat' ? $pick($khachhangIds) : null,
                'loai_hinh'         => $loaiHinh,
                'soniemchi'         => 'DM-' . mt_rand(10000, 99999),
                'trongluong_kg'     => mt_rand(8000, 32000) + (mt_rand(0, 99) / 100),
                'mota_hanghoa'      => $pick($hangHoa),
                'trangthai'         => $trangthai,
                'trangthai_haiquan' => $trangthaiHQ,
                'da_thong_quan'     => $daThongQuan,
                'bi_hong'           => $biHong,
                'ghichu_hong'       => $biHong ? 'Móp nhẹ góc container, không ảnh hưởng hàng hóa' : null,
                'thoigian_vaobai'   => $vaobai?->toDateTimeString(),
                'thoigian_rabai'    => $rabai?->toDateTimeString(),
                'created_at'        => $createdAt->toDateTimeString(),
                'updated_at'        => ($rabai ?? $vaobai ?? $createdAt)->toDateTimeString(),
            ];
        };

        // ── 1) 55 container đã hoàn tất vòng đời (xuatcong) ──────────
        // Trải đều 4 nhóm dwell time, thoigian_rabai nằm trong 28 ngày gần nhất
        // để rơi đúng vào bộ lọc mặc định (30 ngày) của tab Container & KPI.
        for ($i = 0; $i < 55; $i++) {
            $bucket    = $dwellBuckets[$i % 4];
            $dwellDays = mt_rand($bucket[0], $bucket[1]);
            $rabai     = $now->copy()->subDays(mt_rand(1, 28))->subMinutes(mt_rand(0, 600));
            $vaobai    = $rabai->copy()->subDays($dwellDays)->subHours(mt_rand(0, 12));

            $row = $makeContainer('xuatcong', $vaobai, $rabai, $now);
            $macontainer = DB::table('container')->insertGetId($row, 'macontainer');
            $inserted['xuatcong']++;

            $manhanvien = $pick($nvCongIds);

            // logcong: nhập lúc vào bãi
            $logRows[] = [
                'macontainer'   => $macontainer,
                'maphieu'       => null,
                'machuyentau'   => $row['machuyentau'],
                'mataixe'       => null,
                'manhanvien'    => $manhanvien,
                'kieu_xuatnhap' => 'nhap',
                'biensoxe'      => null,
                'niemchi_ktra'  => $row['soniemchi'],
                'niemchi_ok'    => true,
                'haiquan_ok'    => null,
                'ghichu'        => null,
                'thoigian_xl'   => $vaobai->toDateTimeString(),
                'created_at'    => $vaobai->toDateTimeString(),
                'updated_at'    => $vaobai->toDateTimeString(),
            ];

            $mataixe   = $pick($taixeIds);
            $biensoxe  = sprintf('51C-%05d', mt_rand(10000, 99999));

            // logcong: xuất lúc rời bãi
            $logRows[] = [
                'macontainer'   => $macontainer,
                'maphieu'       => null,
                'machuyentau'   => $row['machuyentau'],
                'mataixe'       => $mataixe,
                'manhanvien'    => $manhanvien,
                'kieu_xuatnhap' => 'xuat',
                'biensoxe'      => $biensoxe,
                'niemchi_ktra'  => $row['soniemchi'],
                'niemchi_ok'    => true,
                'haiquan_ok'    => $row['da_thong_quan'],
                'ghichu'        => null,
                'thoigian_xl'   => $rabai->toDateTimeString(),
                'created_at'    => $rabai->toDateTimeString(),
                'updated_at'    => $rabai->toDateTimeString(),
            ];

            // phiếu lấy hàng — trải 4 nhóm turnaround time, khớp thời điểm rời bãi
            $ttBucket = $ttBuckets[$i % 4];
            $ttMin    = mt_rand($ttBucket[0], $ttBucket[1]);
            $laythoi  = $rabai->copy();
            $vaocong  = $laythoi->copy()->subMinutes($ttMin);
            $dencang  = $vaocong->copy()->subMinutes(mt_rand(5, 20));
            $xuatphieu = $vaocong->copy()->subMinutes(mt_rand(30, 180));

            $phieuRows[] = [
                'macontainer'       => $macontainer,
                'manhanvien'        => $manhanvien,
                'mataixe'           => $mataixe,
                'biensoxe'          => $biensoxe,
                'bienso_romo'       => null,
                'vitri_snapshot'    => json_encode(['ghi_chu' => 'demo_seed']),
                'ma_qr'             => 'QR' . strtoupper(bin2hex(random_bytes(9))),
                'trangthai'         => 'da_lay',
                'thoigian_xuat'     => $xuatphieu->toDateTimeString(),
                'thoigian_het_han'  => $xuatphieu->copy()->addHours(4)->toDateTimeString(),
                'thoigian_den_cang' => $dencang->toDateTimeString(),
                'thoigian_vao_cong' => $vaocong->toDateTimeString(),
                'thoigian_lay'      => $laythoi->toDateTimeString(),
                'eta_tu'            => null,
                'eta_den'           => null,
                'ghichu'            => null,
                'created_at'        => $xuatphieu->toDateTimeString(),
                'updated_at'        => $laythoi->toDateTimeString(),
            ];
            $inserted['phieu']++;
        }

        // ── 2) 15 container còn trong bãi — trải aging cho tab Tồn bãi ─
        $agingDays = [2, 4, 6, 8, 10, 12, 14, 18, 22, 26, 30, 38, 45, 55, 65];
        foreach ($agingDays as $i => $days) {
            $vaobai = $now->copy()->subDays($days)->subHours(mt_rand(0, 12));
            $row    = $makeContainer('trongbai', $vaobai, null, $now);
            $macontainer = DB::table('container')->insertGetId($row, 'macontainer');
            $inserted['trongbai']++;

            $manhanvien = $pick($nvCongIds);
            $logRows[] = [
                'macontainer'   => $macontainer,
                'maphieu'       => null,
                'machuyentau'   => $row['machuyentau'],
                'mataixe'       => null,
                'manhanvien'    => $manhanvien,
                'kieu_xuatnhap' => 'nhap',
                'biensoxe'      => null,
                'niemchi_ktra'  => $row['soniemchi'],
                'niemchi_ok'    => true,
                'haiquan_ok'    => null,
                'ghichu'        => null,
                'thoigian_xl'   => $vaobai->toDateTimeString(),
                'created_at'    => $vaobai->toDateTimeString(),
                'updated_at'    => $vaobai->toDateTimeString(),
            ];
        }

        foreach (array_chunk($logRows, 100) as $chunk)   DB::table('logcong')->insert($chunk);
        foreach (array_chunk($phieuRows, 100) as $chunk) DB::table('phieulayhang')->insert($chunk);
        $inserted['logcong'] = count($logRows);

        $this->command->info(sprintf(
            'BaoCaoDemoSeeder: +%d container xuatcong, +%d container trongbai, +%d logcong, +%d phieu lấy hàng.',
            $inserted['xuatcong'], $inserted['trongbai'], $inserted['logcong'], $inserted['phieu']
        ));
    }

    private function existingDemoCount(): int
    {
        return DB::table('container')
            ->where(function ($q) {
                $q->where('socontainer', 'like', 'DEMU%')
                  ->orWhere('socontainer', 'like', 'RPTU%')
                  ->orWhere('socontainer', 'like', 'KPIU%')
                  ->orWhere('socontainer', 'like', 'TDVU%');
            })
            ->count();
    }
}
