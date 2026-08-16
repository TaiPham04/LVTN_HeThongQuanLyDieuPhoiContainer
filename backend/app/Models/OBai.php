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

    // ─── Ràng buộc vật lý: có container nào đang xếp ngay trên ô này không ──
    // Dùng để chặn mọi thao tác giải phóng/di dời ô đang bị container khác
    // "đè" lên phía trên — tránh tạo trạng thái container lơ lửng (tầng trên
    // có hàng, tầng dưới trống) khi vật lý không cho phép nhấc hàng từ giữa cột.
    public function coContTrenDau(): bool
    {
        return self::where('makhuvuc', $this->makhuvuc)
            ->where('khoang', $this->khoang)
            ->where('hang', $this->hang)
            ->where('tang', $this->tang + 1)
            ->where('trangthai', 'dangsudung')
            ->exists();
    }
}