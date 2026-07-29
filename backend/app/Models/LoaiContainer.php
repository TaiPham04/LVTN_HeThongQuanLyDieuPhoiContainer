<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoaiContainer extends Model
{
    protected $table      = 'loaicontainer';
    protected $primaryKey = 'maloai';

    protected $fillable = [
        'maiso',
        'nhom',
        'kieu_cont',
        'tenloai',
        'chieudai_ft',
        'chieurong_ft',
        'chieucao_ft',
        'taitrong_kg',
        'gialuubai_ngay',
        'soNgayMienPhi',
        'trangthai',
    ];

    protected $casts = [
        'chieudai_ft'        => 'decimal:2',
        'chieurong_ft'       => 'decimal:2',
        'chieucao_ft'        => 'decimal:2',
        'taitrong_kg'        => 'decimal:2',
        'gialuubai_ngay'     => 'decimal:2',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function containers()
    {
        return $this->hasMany(Container::class, 'maloai', 'maloai');
    }

    // ─── Scopes ──────────────────────────────────────────────────
    public function scopeHoatDong($query)
    {
        return $query->where('trangthai', 'hoatdong');
    }

    // ─── Helpers ─────────────────────────────────────────────────
    public function dangDuocSuDung(): bool
    {
        return $this->containers()->where('trangthai', '!=', 'khonghoatdong')->exists();
    }
}