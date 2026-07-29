<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KhuVucBai extends Model
{
    protected $table      = 'khuvucbai';
    protected $primaryKey = 'makhuvuc';

    protected $fillable = [
        'tenblock',
        'sokhoang',
        'sohang',
        'sotang',
        'loai_nhom',
        'trangthai',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function obai()
    {
        return $this->hasMany(OBai::class, 'makhuvuc', 'makhuvuc');
    }

    // ─── Scopes ──────────────────────────────────────────────────
    public function scopeHoatDong($query)
    {
        return $query->where('trangthai', 'hoatdong');
    }

    // ─── Helpers ─────────────────────────────────────────────────
    public function tongSoO(): int
    {
        return $this->sokhoang * $this->sohang * $this->sotang;
    }

    public function soODangSuDung(): int
    {
        return $this->obai()->where('trangthai', 'dangsudung')->count();
    }

    public function dangCoContainer(): bool
    {
        return $this->obai()->where('trangthai', 'dangsudung')->exists();
    }
}