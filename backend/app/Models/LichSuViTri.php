<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LichSuViTri extends Model
{
    protected $table      = 'lichsuvitri';
    protected $primaryKey = 'malichsu';

    protected $fillable = [
        'macontainer',
        'maobai',
        'manhanvien',
        'thoigian_gan',
        'thoigian_roi',
        'kieudichchuyen',
        'ghichu',
    ];

    protected $casts = [
        'thoigian_gan' => 'datetime',
        'thoigian_roi' => 'datetime',
    ];

    public function container()
    {
        return $this->belongsTo(Container::class, 'macontainer', 'macontainer');
    }

    public function obai()
    {
        return $this->belongsTo(OBai::class, 'maobai', 'maobai');
    }

    public function nhanvien()
    {
        return $this->belongsTo(User::class, 'manhanvien', 'mataikhoan');
    }
}
