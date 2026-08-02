<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\PhieuLayHang;

class Container extends Model
{
    use SoftDeletes;

    protected $table      = 'container';
    protected $primaryKey = 'macontainer';

    protected $fillable = [
        'socontainer',
        'maloai',
        'machuyentau',
        'makhachhang',
        'loai_hinh',
        'soniemchi',
        'trongluong_kg',
        'mota_hanghoa',
        'trangthai',
        'trangthai_haiquan',
        'da_thong_quan',
        'bi_hong',
        'ghichu_hong',
        'thoigian_vaobai',
        'thoigian_rabai',
    ];

    protected $casts = [
        'bi_hong'        => 'boolean',
        'da_thong_quan'  => 'boolean',
        'trongluong_kg'  => 'decimal:2',
        'thoigian_vaobai' => 'datetime',
        'thoigian_rabai'  => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function loaicontainer()
    {
        return $this->belongsTo(LoaiContainer::class, 'maloai', 'maloai');
    }

    public function chuyentau()
    {
        return $this->belongsTo(ChuyenTau::class, 'machuyentau', 'machuyentau');
    }

    public function phieulayhangs()
    {
        return $this->hasMany(PhieuLayHang::class, 'macontainer', 'macontainer');
    }

    // ─── Helpers ─────────────────────────────────────────────────
    public function dangTrongBai(): bool
    {
        return $this->trangthai === 'trongbai';
    }

    // Phân luồng hải quan ngẫu nhiên ngay khi container vào hệ thống — mô phỏng
    // kết quả phân luồng VNACCS (tiêu chí đánh giá thật nằm ngoài phạm vi hệ thống này).
    // Tỉ lệ: xanh 70% / vàng 25% / đỏ 5%.
    public static function phanLuongNgauNhien(): array
    {
        $r = mt_rand(1, 100);
        $luong = $r <= 70 ? 'luong_xanh' : ($r <= 95 ? 'luong_vang' : 'luong_do');

        return [
            'trangthai_haiquan' => $luong,
            'da_thong_quan'     => $luong === 'luong_xanh',
        ];
    }
}
