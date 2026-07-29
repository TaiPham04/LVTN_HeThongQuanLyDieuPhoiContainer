<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KhachHang extends Model
{
    protected $table      = 'khachhang';
    protected $primaryKey = 'makhachhang';
    public    $incrementing = false;

    protected $fillable = [
        'makhachhang',
        'tentochuc',
    ];

    public function taikhoan()
    {
        return $this->belongsTo(User::class, 'makhachhang', 'mataikhoan');
    }
}
