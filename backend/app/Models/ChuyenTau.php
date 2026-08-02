<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChuyenTau extends Model
{
    protected $table      = 'chuyentau';
    protected $primaryKey = 'machuyentau';

    protected $fillable = [
        'mahangtau',
        'tentau',
        'sovoyage',
        'cangxuatphat',
        'cangdich',
        'thoigiandukien',
        'thoigianroiben',
        'thoigiandenthuc',
        'thoigianroithuc',
        'socontainerdukien',
        'trangthai',
    ];

    protected $casts = [
        'thoigiandukien'  => 'datetime',
        'thoigianroiben'  => 'datetime',
        'thoigiandenthuc' => 'datetime',
        'thoigianroithuc' => 'datetime',
    ];

    public function hangtau()
    {
        return $this->belongsTo(HangTau::class, 'mahangtau', 'mahangtau');
    }

    public function containers()
    {
        return $this->hasMany(Container::class, 'machuyentau', 'machuyentau');
    }

    // ─── Khung thời gian hạ bãi (Lowering Window) ─────────────────
    // Container hàng xuất chỉ được kéo vào bãi trong khoảng [Mở hạ bãi, Đóng hạ bãi]
    // trước giờ tàu rời bến — mô phỏng đúng nghiệp vụ Opening Time / CY Cut-off Time
    // thực tế của ngành logistics. Tính động, không lưu cột riêng.
    private const SO_NGAY_MO_HA_BAI  = 4;  // Opening Time = ETD - 4 ngày
    private const SO_GIO_DONG_HA_BAI = 12; // Closing Time (cut-off) = ETD - 12 giờ

    public function thoiGianMoHaBai(): ?\Illuminate\Support\Carbon
    {
        return $this->thoigianroiben?->copy()->subDays(self::SO_NGAY_MO_HA_BAI);
    }

    public function thoiGianDongHaBai(): ?\Illuminate\Support\Carbon
    {
        return $this->thoigianroiben?->copy()->subHours(self::SO_GIO_DONG_HA_BAI);
    }

    // Chuyến chưa có ETD (thoigianroiben null) thì không đủ dữ liệu để chặn — cho qua
    // để không làm gãy các chuyến demo/dữ liệu cũ thiếu thông tin.
    public function trongKhungHaBai(): bool
    {
        if (!$this->thoigianroiben) {
            return true;
        }
        return now()->between($this->thoiGianMoHaBai(), $this->thoiGianDongHaBai());
    }

    public function thongBaoNgoaiKhungHaBai(): string
    {
        $mo   = $this->thoiGianMoHaBai();
        $dong = $this->thoiGianDongHaBai();

        if (now()->lessThan($mo)) {
            return "Chưa tới thời gian mở hạ bãi cho chuyến {$this->sovoyage} — mở lúc {$mo->format('d/m/Y H:i')}.";
        }

        return "Đã quá giờ đóng hạ bãi (cắt máng) cho chuyến {$this->sovoyage} — đóng lúc {$dong->format('d/m/Y H:i')}.";
    }
}
