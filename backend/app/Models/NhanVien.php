<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NhanVien extends Model
{
    protected $table      = 'nhanvien';
    protected $primaryKey = 'manhanvien';
    public    $incrementing = false;

    protected $fillable = [
        'manhanvien',
    ];

    public function taikhoan()
    {
        return $this->belongsTo(User::class, 'manhanvien', 'mataikhoan');
    }
}
