<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TaiXe extends Model
{
    use SoftDeletes;

    protected $table      = 'taixe';
    protected $primaryKey = 'mataixe';

    protected $fillable = [
        'mataikhoan',
        'makhachhang',
        'hoten',
        'sodienthoai',
        'cccd',
        'biensoxe',
        'trangthai',
    ];

    public function khachhang()
    {
        return $this->belongsTo(User::class, 'makhachhang', 'mataikhoan');
    }

    public function taikhoan()
    {
        return $this->belongsTo(User::class, 'mataikhoan', 'mataikhoan');
    }
}
