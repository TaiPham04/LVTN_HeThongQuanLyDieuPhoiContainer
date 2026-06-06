<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'mataikhoan'  => $this->mataikhoan,
            'mavaitro'    => $this->mavaitro,
            'role'        => $this->vaitro?->tenvaitro,
            'hoten'       => $this->hoten,
            'email'       => $this->email,
            'sodienthoai' => $this->sodienthoai,
            'tentochinhe' => $this->tentochinhe,
            'trangthai'   => $this->trangthai,
            'created_at'  => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}