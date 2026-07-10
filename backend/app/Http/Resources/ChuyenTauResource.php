<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ChuyenTauResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'machuyentau'       => $this->machuyentau,
            'mahangtau'         => $this->mahangtau,
            'mascac'            => $this->hangtau->mascac ?? null,
            'tenhangtau'        => $this->hangtau->tenhangtau ?? null,
            'tentau'            => $this->tentau,
            'sovoyage'          => $this->sovoyage,
            'cangxuatphat'      => $this->cangxuatphat,
            'cangdich'          => $this->cangdich,
            'thoigiandukien'    => $this->thoigiandukien?->format('Y-m-d\TH:i'),
            'thoigianroiben'    => $this->thoigianroiben?->format('Y-m-d\TH:i'),
            'thoigiandenthuc'   => $this->thoigiandenthuc?->format('Y-m-d\TH:i'),
            'thoigianroithuc'   => $this->thoigianroithuc?->format('Y-m-d\TH:i'),
            'socontainerdukien'  => $this->socontainerdukien,
            'so_container_cho_do' => $this->whenLoaded('containers',
                fn () => $this->containers->where('trangthai', 'dangky')->count(),
                null
            ),
            'so_container_nhap'   => $this->whenLoaded('containers',
                fn () => $this->containers->where('loai_hinh', 'nhap')->whereIn('trangthai', ['trongbai', 'xuatcong'])->count(),
                null
            ),
            'trangthai'          => $this->trangthai,
            'created_at'        => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
