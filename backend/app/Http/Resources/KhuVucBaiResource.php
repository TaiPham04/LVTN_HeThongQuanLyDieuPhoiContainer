<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class KhuVucBaiResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $tongSoO     = $this->sokhoang * $this->sohang * $this->sotang;
        $soODangDung = $this->obai()->where('trangthai', 'dangsudung')->count();

        return [
            'makhuvuc'       => $this->makhuvuc,
            'tenblock'       => $this->tenblock,
            'sokhoang'       => $this->sokhoang,
            'sohang'         => $this->sohang,
            'sotang'         => $this->sotang,
            'loai_nhom'      => $this->loai_nhom,
            'trangthai'      => $this->trangthai,
            'tong_so_o'      => $tongSoO,
            'so_o_dang_dung' => $soODangDung,
            'so_o_trong'     => $tongSoO - $soODangDung,
            'ti_le_su_dung'  => $tongSoO > 0
                ? round($soODangDung / $tongSoO * 100, 1)
                : 0,
            'created_at'     => $this->created_at?->format('d/m/Y H:i'),
            'updated_at'     => $this->updated_at?->format('d/m/Y H:i'),
        ];
    }
}
