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
        'lablock_lanh',
        'lablock_hangnguy',
        'soocamlanh',
        'trangthai',
    ];

    protected $casts = [
        'lablock_lanh'     => 'boolean',
        'lablock_hangnguy' => 'boolean',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function obai()
    {
        return $this->hasMany(OBai::class, 'makhuvuc', 'makhuvuc');
    }

    public function loaicontainer()
    {
        return $this->belongsToMany(
            LoaiContainer::class,
            'loaicontainer_khuvuc',
            'makhuvuc',
            'maloai'
        );
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