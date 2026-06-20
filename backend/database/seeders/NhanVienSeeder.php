<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class NhanVienSeeder extends Seeder
{
    public function run(): void
    {
        User::firstOrCreate(
            ['email' => 'nvcong@catlaiharbor.vn'],
            [
                'mavaitro'    => 5,
                'hoten'       => 'Nguyễn Văn Cổng',
                'matkhau'     => Hash::make('123456'),
                'sodienthoai' => '0901000001',
                'trangthai'   => 'hoatdong',
            ]
        );

        User::firstOrCreate(
            ['email' => 'nvbai@catlaiharbor.vn'],
            [
                'mavaitro'    => 6,
                'hoten'       => 'Trần Thị Bãi',
                'matkhau'     => Hash::make('123456'),
                'sodienthoai' => '0901000002',
                'trangthai'   => 'hoatdong',
            ]
        );
    }
}
