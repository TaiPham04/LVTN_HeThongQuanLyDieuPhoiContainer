<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class BienBanKTResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $container = $this->container;
        $hangtau   = $container?->chuyentau?->hangtau;

        return [
            'mabienban'      => $this->mabienban,
            'macontainer'    => $this->macontainer,
            'socontainer'    => $container?->socontainer,
            'mascac'         => $hangtau?->mascac,
            'tenhangtau'     => $hangtau?->tenhangtau,
            'manhanvien'     => $this->manhanvien,
            'hoten_nhanvien' => $this->nhanvien?->hoten,
            'loaiktd'        => $this->loaiktd,
            'ketqua_ktd'     => $this->ketqua_ktd,
            'bi_hong'        => $this->bi_hong,
            'ketluan'        => $this->ketluan,
            'thoigian_ktd'   => $this->thoigian_ktd?->format('d/m/Y H:i'),
            'created_at'     => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
