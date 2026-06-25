<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoaiContainerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'maloai'         => $this->maloai,
            'maiso'          => $this->maiso,
            'tenloai'        => $this->tenloai,
            'chieudai_ft'    => (float) $this->chieudai_ft,
            'chieurong_ft'   => (float) $this->chieurong_ft,
            'chieucao_ft'    => (float) $this->chieucao_ft,
            'taithong_kg'    => (float) $this->taithong_kg,
            'lalanh'             => (bool)  $this->lalanh,
            'lahangnguy'         => (bool)  $this->lahangnguy,
            'cho_phep_xep_chong' => (bool)  $this->cho_phep_xep_chong,
            'tang_toi_da'        => $this->tang_toi_da !== null ? (int) $this->tang_toi_da : null,
            'gialuubai_ngay'     => (float) $this->gialuubai_ngay,
            'soNgayMienPhi'  => $this->soNgayMienPhi,
            'trangthai'      => $this->trangthai,
            'created_at'     => $this->created_at?->format('d/m/Y H:i'),
            'updated_at'     => $this->updated_at?->format('d/m/Y H:i'),
        ];
    }
}