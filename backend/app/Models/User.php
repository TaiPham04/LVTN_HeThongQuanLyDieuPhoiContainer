<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    protected $table = 'taikhoan';
    protected $primaryKey = 'mataikhoan';

    protected $fillable = [
        'mavaitro',
        'hoten',
        'email',
        'matkhau',
        'sodienthoai',
        'tentochinhe',
        'trangthai',
    ];

    protected $hidden = [
        'matkhau',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'deleted_at'        => 'datetime',
    ];

    // Laravel dùng 'password' để xác thực — map sang 'matkhau'
    public function getAuthPassword()
    {
        return $this->matkhau;
    }

    // ─── Relationships ───────────────────────────────────────────
    public function vaitro()
    {
        return $this->belongsTo(VaiTro::class, 'mavaitro', 'mavaitro');
    }

    public function taixe()
    {
        return $this->hasMany(TaiXe::class, 'makhachhang', 'mataikhoan');
    }

    public function xe()
    {
        return $this->hasMany(Xe::class, 'makhachhang', 'mataikhoan');
    }

    public function containers()
    {
        return $this->hasMany(Container::class, 'makhachhang', 'mataikhoan');
    }

    public function ebookings()
    {
        return $this->hasMany(EBooking::class, 'makhachhang', 'mataikhoan');
    }

    // ─── Helpers ─────────────────────────────────────────────────
    public function laNhanVien(): bool
    {
        return in_array($this->mavaitro, [1, 2]); // admin hoặc nhanvien
    }

    public function laAdmin(): bool
    {
        return $this->mavaitro === 1;
    }

    public function laKhachHang(): bool
    {
        return $this->mavaitro === 3;
    }

    public function dangHoatDong(): bool
    {
        return $this->trangthai === 'hoatdong';
    }
}