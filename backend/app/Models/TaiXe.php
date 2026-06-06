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
        'makhachhang',
        'hoten',
        'sodienthoai',
        'sobanglai',
        'email',
        'matkhau',
        'trangthai',
    ];

    protected $hidden = ['matkhau'];

    public function khachhang()
    {
        return $this->belongsTo(User::class, 'makhachhang', 'mataikhoan');
    }
}
