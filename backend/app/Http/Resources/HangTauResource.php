<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HangTauResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'mahangtau'  => $this->mahangtau,
            'mascac'     => $this->mascac,
            'tenhangtau' => $this->tenhangtau,
            'quocgia'    => $this->quocgia,
            'email'      => $this->email,
            'trangthai'  => $this->trangthai,
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
            'updated_at' => $this->updated_at?->format('d/m/Y H:i'),
        ];
    }
}