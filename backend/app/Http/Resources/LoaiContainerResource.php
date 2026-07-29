<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoaiContainerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        // Derive kichthuoc từ chieudai_ft
        $chieudai = (float) $this->chieudai_ft;
        $kichthuoc = match(true) {
            $chieudai >= 45 => '45ft',
            $chieudai >= 40 => '40ft',
            default         => '20ft',
        };

        return [
            'maloai'         => $this->maloai,
            'maiso'          => $this->maiso,
            'nhom'           => $this->nhom,
            'kieu_cont'      => $this->kieu_cont,
            'kichthuoc'      => $kichthuoc,
            'tenloai'        => $this->tenloai,
            'chieudai_ft'    => (float) $this->chieudai_ft,
            'chieurong_ft'   => (float) $this->chieurong_ft,
            'chieucao_ft'    => (float) $this->chieucao_ft,
            'taitrong_kg'    => (float) $this->taitrong_kg,
            'gialuubai_ngay'     => (float) $this->gialuubai_ngay,
            'soNgayMienPhi'  => $this->soNgayMienPhi,
            'trangthai'      => $this->trangthai,
            'created_at'     => $this->created_at?->format('d/m/Y H:i'),
            'updated_at'     => $this->updated_at?->format('d/m/Y H:i'),
        ];
    }
}