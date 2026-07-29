<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LogCongResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $container = $this->container;
        $hangtau   = $container?->chuyentau?->hangtau;
        $chuyen    = $this->chuyentau;

        return [
            'malogcong'        => $this->malogcong,
            'macontainer'      => $this->macontainer,
            'socontainer'      => $container?->socontainer,
            'maphieu'          => $this->maphieu,
            'mascac'           => $hangtau?->mascac,
            'tenhangtau'       => $hangtau?->tenhangtau,
            'machuyentau'      => $this->machuyentau,
            'sovoyage'         => $chuyen?->sovoyage,
            'tentau'           => $chuyen?->tentau,
            'mataixe'          => $this->mataixe,
            'hoten_taixe'      => $this->taixe?->hoten,
            'sdt_taixe'        => $this->taixe?->sodienthoai,
            'manhanvien'       => $this->manhanvien,
            'hoten_nhanvien'   => $this->nhanvien?->hoten,
            'kieu_xuatnhap'    => $this->kieu_xuatnhap,
            'biensoxe'         => $this->biensoxe,
            'niemchi_ktra'     => $this->niemchi_ktra,
            'niemchi_ok'       => $this->niemchi_ok,
            'haiquan_ok'       => $this->haiquan_ok,
            'ghichu'           => $this->ghichu,
            'thoigian_xl'      => $this->thoigian_xl?->format('d/m/Y H:i'),
            'created_at'       => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
