<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoaiContainer extends Model
{
    protected $table      = 'loaicontainer';
    protected $primaryKey = 'maloai';

    protected $fillable = [
        'maiso',
        'tenloai',
        'chieudai_ft',
        'chieurong_ft',
        'chieucao_ft',
        'taithong_kg',
        'lalanh',
        'lahangnguy',
        'cho_phep_xep_chong',
        'tang_toi_da',
        'gialuubai_ngay',
        'soNgayMienPhi',
        'trangthai',
    ];

    protected $casts = [
        'chieudai_ft'        => 'decimal:2',
        'chieurong_ft'       => 'decimal:2',
        'chieucao_ft'        => 'decimal:2',
        'taithong_kg'        => 'decimal:2',
        'gialuubai_ngay'     => 'decimal:2',
        'lalanh'             => 'boolean',
        'lahangnguy'         => 'boolean',
        'cho_phep_xep_chong' => 'boolean',
        'tang_toi_da'        => 'integer',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function containers()
    {
        return $this->hasMany(Container::class, 'maloai', 'maloai');
    }

    public function khuvucbai()
    {
        return $this->belongsToMany(
            KhuVucBai::class,
            'loaicontainer_khuvuc',
            'maloai',
            'makhuvuc'
        );
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