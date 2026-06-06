<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Container extends Model
{
    use SoftDeletes;

    protected $table      = 'container';
    protected $primaryKey = 'macontainer';

    protected $fillable = [
        'socontainer',
        'maloai',
        'mahangtau',
        'machuyentau',
        'makhachhang',
        'soniemchi',
        'trongluong_kg',
        'mota_hanghoa',
        'trangthai',
        'trangthai_haiquan',
        'bi_hong',
        'ghichu_hong',
        'thoigian_vaobai',
        'thoigian_rabai',
    ];

    protected $casts = [
        'bi_hong'        => 'boolean',
        'trongluong_kg'  => 'decimal:2',
        'thoigian_vaobai' => 'datetime',
        'thoigian_rabai'  => 'datetime',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function loaicontainer()
    {
        return $this->belongsTo(LoaiContainer::class, 'maloai', 'maloai');
    }

    public function hangtau()
    {
        return $this->belongsTo(HangTau::class, 'mahangtau', 'mahangtau');
    }

    public function chuyentau()
    {
        return $this->belongsTo(ChuyenTau::class, 'machuyentau', 'machuyentau');
    }

    // ─── Helpers ─────────────────────────────────────────────────
    public function dangTrongBai(): bool
    {
        return $this->trangthai === 'trongbai';
    }
}
