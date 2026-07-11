<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhieuLayHang extends Model
{
    protected $table      = 'phieulayhang';
    protected $primaryKey = 'maphieu';

    protected $fillable = [
        'macontainer',
        'manhanvien',
        'mataixe',
        'biensoxe',
        'bienso_romo',
        'vitri_snapshot',
        'ma_qr',
        'trangthai',
        'thoigian_xuat',
        'thoigian_het_han',
        'thoigian_den_cang',
        'thoigian_vao_cong',
        'thoigian_lay',
        'eta_tu',
        'eta_den',
        'ghichu',
    ];

    protected $casts = [
        'vitri_snapshot'    => 'array',
        'thoigian_xuat'     => 'datetime',
        'thoigian_het_han'  => 'datetime',
        'thoigian_den_cang'  => 'datetime',
        'thoigian_vao_cong'  => 'datetime',
        'thoigian_lay'       => 'datetime',
        'eta_tu'             => 'datetime',
        'eta_den'            => 'datetime',
    ];

    public function container()
    {
        return $this->belongsTo(Container::class, 'macontainer', 'macontainer');
    }

    public function nhanvien()
    {
        return $this->belongsTo(User::class, 'manhanvien', 'mataikhoan');
    }

    public function taixe()
    {
        return $this->belongsTo(TaiXe::class, 'mataixe', 'mataixe');
    }
}
