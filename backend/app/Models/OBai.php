<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OBai extends Model
{
    protected $table      = 'obai';
    protected $primaryKey = 'maobai';

    protected $fillable = [
        'makhuvuc',
        'khoang',
        'hang',
        'tang',
        'maobai_code',
        'trangthai',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function khuvucbai()
    {
        return $this->belongsTo(KhuVucBai::class, 'makhuvuc', 'makhuvuc');
    }

    public function lichsuvitri()
    {
        return $this->hasMany(LichSuViTri::class, 'maobai', 'maobai');
    }

    public function vitriHienTai()
    {
        return $this->hasOne(LichSuViTri::class, 'maobai', 'maobai')
            ->whereNull('thoigian_roi')
            ->latest('thoigian_gan');
    }
}