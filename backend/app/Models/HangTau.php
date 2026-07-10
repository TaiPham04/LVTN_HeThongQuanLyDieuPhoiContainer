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