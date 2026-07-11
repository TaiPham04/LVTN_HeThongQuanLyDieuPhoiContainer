<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BienBanKT extends Model
{
    protected $table      = 'bienbanktd';
    protected $primaryKey = 'mabienban';

    protected $fillable = [
        'macontainer',
        'manhanvien',
        'loaiktd',
        'chu_ky',
        'ketqua_ktd',
        'bi_hong',
        'anhchup',
        'ketluan',
        'thoigian_ktd',
    ];

    protected $casts = [
        'bi_hong'      => 'boolean',
        'anhchup'      => 'array',
        'thoigian_ktd' => 'datetime',
    ];

    public function container()
    {
        return $this->belongsTo(Container::class, 'macontainer', 'macontainer');
    }

    public function nhanvien()
    {
        return $this->belongsTo(User::class, 'manhanvien', 'mataikhoan');
    }
}
