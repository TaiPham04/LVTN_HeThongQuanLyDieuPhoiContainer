<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogCong extends Model
{
    protected $table      = 'logcong';
    protected $primaryKey = 'malogcong';

    protected $fillable = [
        'mabooking',
        'macontainer',
        'machuyentau',
        'mataixe',
        'manhanvien',
        'kieu_xuatnhap',
        'biensoxe',
        'niemchi_ktra',
        'niemchi_ok',
        'haiquan_ok',
        'ghichu',
        'thoigian_xl',
    ];

    protected $casts = [
        'niemchi_ok' => 'boolean',
        'haiquan_ok' => 'boolean',
        'thoigian_xl' => 'datetime',
    ];

    public function container()
    {
        return $this->belongsTo(Container::class, 'macontainer', 'macontainer');
    }

    public function chuyentau()
    {
        return $this->belongsTo(ChuyenTau::class, 'machuyentau', 'machuyentau');
    }

    public function taixe()
    {
        return $this->belongsTo(TaiXe::class, 'mataixe', 'mataixe');
    }

    public function nhanvien()
    {
        return $this->belongsTo(User::class, 'manhanvien', 'mataikhoan');
    }
}
