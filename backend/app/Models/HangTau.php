<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HangTau extends Model
{
    protected $table      = 'hangtau';
    protected $primaryKey = 'mahangtau';

    protected $fillable = [
        'mascac',
        'tenhangtau',
        'quocgia',
        'email',
        'trangthai',
    ];

    // ─── Relationships ───────────────────────────────────────────
    public function chuyentau()
    {
        return $this->hasMany(ChuyenTau::class, 'mahangtau', 'mahangtau');
    }

    // Container không có cột mahangtau trực tiếp — chỉ liên kết qua chuyentau
    public function containers()
    {
        return $this->hasManyThrough(
            Container::class, ChuyenTau::class,
            'mahangtau', 'machuyentau', 'mahangtau', 'machuyentau'
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
        return $this->chuyentau()
            ->whereIn('trangthai', ['dalenlich', 'dadencang'])
            ->exists();
    }
}