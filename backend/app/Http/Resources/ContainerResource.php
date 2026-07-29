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
            'loai_hinh'         => $this->loai_hinh,
            'maloai'            => $this->maloai,
            'maiso'             => $this->loaicontainer?->maiso,
            'tenloai'           => $this->loaicontainer?->tenloai,
            'machuyentau'       => $this->machuyentau,
            'sovoyage'          => $this->chuyentau?->sovoyage,
            'tentau'            => $this->chuyentau?->tentau,
            'mascac'            => $this->chuyentau?->hangtau?->mascac,
            'tenhangtau'        => $this->chuyentau?->hangtau?->tenhangtau,
            'makhachhang'       => $this->makhachhang,
            'so_vandon'         => $this->so_vandon,
            'ten_consignee'     => $this->ten_consignee,
            'soniemchi'         => $this->soniemchi,
            'trongluong_kg'     => $this->trongluong_kg,
            'mota_hanghoa'      => $this->mota_hanghoa,
            'trangthai'         => $this->trangthai,
            'trangthai_haiquan' => $this->trangthai_haiquan,
            'da_thong_quan'     => (bool) $this->da_thong_quan,
            'bi_hong'           => (bool) $this->bi_hong,
            'ghichu_hong'       => $this->ghichu_hong,
            'thoigian_vaobai'   => $this->thoigian_vaobai?->format('d/m/Y H:i'),
            'thoigian_rabai'    => $this->thoigian_rabai?->format('d/m/Y H:i'),
            'created_at'        => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
