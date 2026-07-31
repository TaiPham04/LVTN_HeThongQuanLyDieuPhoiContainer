<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

/**
 * Đảm bảo mỗi khách hàng có 1-3 tài xế (hiện hệ thống chỉ có đúng 1 tài xế
 * cho toàn bộ 11 khách hàng — không đủ để demo tính năng "Quản lý tài xế").
 *
 * Mỗi tài xế = 1 dòng `taikhoan` (mavaitro=4, để tự đăng nhập) + 1 dòng
 * `taixe` (makhachhang trỏ đúng khách hàng sở hữu) — đúng luồng tạo tài xế
 * thật của TaiXeKHController::store, chỉ khác là insert trực tiếp qua DB
 * thay vì gọi API. An toàn chạy lại nhiều lần — chỉ thêm cho tới khi đạt
 * 1-3 tài xế/khách hàng, không xóa/sửa tài xế đã có.
 */
class TaiXeDemoSeeder extends Seeder
{
    public function run(): void
    {
        $now = Carbon::now();

        $hoTen = [
            'Nguyễn Văn Tài', 'Trần Văn Hùng', 'Lê Minh Đức', 'Phạm Văn Sơn', 'Hoàng Văn Long',
            'Vũ Văn Thắng', 'Đặng Văn Kiên', 'Bùi Văn Nghĩa', 'Ngô Văn Phong', 'Đỗ Văn Hải',
            'Trịnh Văn Dũng', 'Lý Văn Cường', 'Phan Văn Tuấn', 'Đoàn Văn Khoa', 'Mai Văn Vinh',
            'Trương Văn Bình', 'Huỳnh Văn Đạt', 'Cao Văn Quang', 'Lâm Văn Thành', 'Vương Văn Toàn',
            'Đinh Văn Hiếu', 'Tô Văn Lộc', 'Chu Văn Phát', 'Kiều Văn Nhân', 'Tạ Văn Trung',
            'Từ Văn Duy', 'Hồ Văn Nguyên', 'La Văn Thịnh', 'Quách Văn Anh', 'Diệp Văn Khang',
        ];

        $khachHangList = DB::table('khachhang')->pluck('makhachhang');

        $maxTaikhoan = (int) DB::table('taikhoan')->max('mataikhoan');
        $maxTaixe    = (int) DB::table('taixe')->max('mataixe');
        $emailSeq    = 1;

        $usedPhone = DB::table('taixe')->pluck('sodienthoai')->flip()->all();
        $usedCccd  = DB::table('taixe')->whereNotNull('cccd')->pluck('cccd')->flip()->all();
        $usedPlate = DB::table('taixe')->whereNotNull('biensoxe')->pluck('biensoxe')->flip()->all();

        $randomDigits = function (int $len) {
            $s = '';
            for ($i = 0; $i < $len; $i++) $s .= mt_rand(0, 9);
            return $s;
        };

        $genPhone = function () use ($randomDigits, &$usedPhone) {
            do { $p = '0' . mt_rand(3, 9) . $randomDigits(8); } while (isset($usedPhone[$p]));
            $usedPhone[$p] = true;
            return $p;
        };
        $genCccd = function () use ($randomDigits, &$usedCccd) {
            do { $c = '0' . $randomDigits(11); } while (isset($usedCccd[$c]));
            $usedCccd[$c] = true;
            return $c;
        };
        $genPlate = function () use (&$usedPlate) {
            $letters = ['A','B','C','D','E','F','G','H','K','L'];
            do {
                $p = sprintf('%02d%s-%05d', mt_rand(15, 51), $letters[array_rand($letters)], mt_rand(10000, 99999));
            } while (isset($usedPlate[$p]));
            $usedPlate[$p] = true;
            return $p;
        };

        $taikhoanRows = [];
        $taixeRows    = [];
        $totalAdded   = 0;

        foreach ($khachHangList as $makhachhang) {
            $existing = DB::table('taixe')->where('makhachhang', $makhachhang)->count();
            $target   = mt_rand(1, 3);
            $need     = max(0, $target - $existing);

            for ($i = 0; $i < $need; $i++) {
                $hoten = $hoTen[array_rand($hoTen)];
                $sdt   = $genPhone();

                $maxTaikhoan++;
                $taikhoanRows[] = [
                    'mataikhoan'  => $maxTaikhoan,
                    'mavaitro'    => 4,
                    'hoten'       => $hoten,
                    'email'       => 'taixe.demo' . ($emailSeq++) . '@catlaiharbor.vn',
                    'matkhau'     => Hash::make('taixe12345'),
                    'sodienthoai' => $sdt,
                    'trangthai'   => 'hoatdong',
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];

                $maxTaixe++;
                $taixeRows[] = [
                    'mataixe'     => $maxTaixe,
                    'mataikhoan'  => $maxTaikhoan,
                    'makhachhang' => $makhachhang,
                    'hoten'       => $hoten,
                    'sodienthoai' => $sdt,
                    'cccd'        => $genCccd(),
                    'biensoxe'    => $genPlate(),
                    'trangthai'   => 'hoatdong',
                    'created_at'  => $now,
                    'updated_at'  => $now,
                ];

                $totalAdded++;
            }
        }

        if (empty($taikhoanRows)) {
            $this->command->warn('TaiXeDemoSeeder: mọi khách hàng đã có đủ 1-3 tài xế, không thêm gì.');
            return;
        }

        DB::table('taikhoan')->insert($taikhoanRows);
        DB::table('taixe')->insert($taixeRows);

        $this->command->info("TaiXeDemoSeeder: đã thêm {$totalAdded} tài xế mới (mật khẩu chung: taixe12345).");
    }
}
