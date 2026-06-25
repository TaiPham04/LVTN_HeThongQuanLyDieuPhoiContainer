<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuyenTau extends Model
{
    protected $table      = 'chuyentau';
    protected $primaryKey = 'machuyentau';

    protected $fillable = [
        'mahangtau',
        'tentau',
        'sovoyage',
        'cangxuatphat',
        'cangdich',
        'thoigiandukien',
        'thoigianroiben',
        'thoigiandenthuc',
        'thoigianroithuc',
        'socontainerdukien',
        'trangthai',
    ];

    protected $casts = [
        'thoigiandukien'  => 'datetime',
        'thoigianroiben'  => 'datetime',
        'thoigiandenthuc' => 'datetime',
        'thoigianroithuc' => 'datetime',
    ];

    public function hangtau()
    {
        return $this->belongsTo(HangTau::class, 'mahangtau', 'mahangtau');
    }

    public function containers()
    {
        return $this->hasMany(Container::class, 'machuyentau', 'machuyentau');
    }
}
