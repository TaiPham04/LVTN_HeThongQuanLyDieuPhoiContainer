<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LogXoa extends Model
{
    protected $table      = 'logxoa';
    protected $primaryKey = 'malogxoa';

    protected $fillable = [
        'loaidoituong',
        'madoituong',
        'tendoituong',
        'nguoixoa',
        'lydo_xoa',
        'chuoixacnhan',
        'thoigian_xoa',
    ];

    protected $casts = [
        'thoigian_xoa' => 'datetime',
    ];

    public function nguoiXoa()
    {
        return $this->belongsTo(User::class, 'nguoixoa', 'mataikhoan');
    }
}