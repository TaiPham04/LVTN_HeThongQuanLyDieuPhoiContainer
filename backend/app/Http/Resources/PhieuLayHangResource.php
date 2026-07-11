<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PhieuLayHangResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $container = $this->container;
        $hangtau   = $container?->chuyentau?->hangtau;
        $vitri     = $this->vitri_snapshot ?? [];

        return [
            'maphieu'          => $this->maphieu,
            'ma_qr'            => $this->ma_qr,
            'trangthai'        => $this->trangthai,
            // Container
            'macontainer'      => $this->macontainer,
            'socontainer'      => $container?->socontainer,
            'mascac'           => $hangtau?->mascac,
            'tenhangtau'       => $hangtau?->tenhangtau,
            'maloai'           => $container?->maloai,
            'trongluong_kg'    => $container?->trongluong_kg,
            'soniemchi'        => $container?->soniemchi,
            // Vị trí (snapshot)
            'vitri_snapshot'   => $vitri,
            'tenblock'         => $vitri['tenblock'] ?? null,
            'khoang'           => $vitri['khoang'] ?? null,
            'hang'             => $vitri['hang'] ?? null,
            'tang'             => $vitri['tang'] ?? null,
            'maobai_code'      => $vitri['maobai_code'] ?? null,
            // Tài xế / xe
            'mataixe'          => $this->mataixe,
            'hoten_taixe'      => $this->taixe?->hoten,
            'sdt_taixe'        => $this->taixe?->sodienthoai,
            'biensoxe'         => $this->biensoxe,
            'bienso_romo'      => $this->bienso_romo,
            // Nhân viên xuất phiếu
            'manhanvien'       => $this->manhanvien,
            'hoten_nhanvien'   => $this->nhanvien?->hoten,
            // Thời gian
            'thoigian_xuat'      => $this->thoigian_xuat?->format('d/m/Y H:i'),
            'thoigian_het_han'   => $this->thoigian_het_han?->format('d/m/Y H:i'),
            'thoigian_den_cang'  => $this->thoigian_den_cang?->format('d/m/Y H:i'),
            'thoigian_vao_cong'  => $this->thoigian_vao_cong?->format('d/m/Y H:i'),
            'thoigian_lay'       => $this->thoigian_lay?->format('d/m/Y H:i'),
            // Khung giờ ETA
            'eta_tu'             => $this->eta_tu?->format('d/m/Y H:i'),
            'eta_den'            => $this->eta_den?->format('d/m/Y H:i'),
            // Khác
            'ghichu'           => $this->ghichu,
            'created_at'       => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
