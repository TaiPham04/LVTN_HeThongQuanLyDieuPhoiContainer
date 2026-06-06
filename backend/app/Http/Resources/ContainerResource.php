<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContainerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'macontainer'       => $this->macontainer,
            'socontainer'       => $this->socontainer,
            'maloai'            => $this->maloai,
            'maiso'             => $this->loaicontainer->maiso ?? null,
            'tenloai'           => $this->loaicontainer->tenloai ?? null,
            'lalanh'            => $this->loaicontainer->lalanh ?? false,
            'mahangtau'         => $this->mahangtau,
            'mascac'            => $this->hangtau->mascac ?? null,
            'tenhangtau'        => $this->hangtau->tenhangtau ?? null,
            'machuyentau'       => $this->machuyentau,
            'sovoyage'          => $this->chuyentau->sovoyage ?? null,
            'tentau'            => $this->chuyentau->tentau ?? null,
            'makhachhang'       => $this->makhachhang,
            'soniemchi'         => $this->soniemchi,
            'trongluong_kg'     => $this->trongluong_kg,
            'mota_hanghoa'      => $this->mota_hanghoa,
            'trangthai'         => $this->trangthai,
            'trangthai_haiquan' => $this->trangthai_haiquan,
            'bi_hong'           => (bool) $this->bi_hong,
            'ghichu_hong'       => $this->ghichu_hong,
            'thoigian_vaobai'   => $this->thoigian_vaobai?->format('d/m/Y H:i'),
            'thoigian_rabai'    => $this->thoigian_rabai?->format('d/m/Y H:i'),
            'created_at'        => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
