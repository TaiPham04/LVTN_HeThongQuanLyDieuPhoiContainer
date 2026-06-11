<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KhuVucBai;
use Illuminate\Http\JsonResponse;

class SoDoBaiController extends Controller
{
    // ─── GET /api/admin/so-do-bai ─────────────────────────────────
    // Danh sách block cho dropdown (không phân trang)
    public function index(): JsonResponse
    {
        $blocks = KhuVucBai::hoatDong()
            ->orderBy('tenblock')
            ->get(['makhuvuc', 'tenblock', 'sokhoang', 'sohang', 'sotang', 'lablock_lanh']);

        return response()->json(['data' => $blocks]);
    }

    // ─── GET /api/admin/so-do-bai/{khuvucbai} ─────────────────────
    // Toàn bộ ô bãi + container hiện tại của 1 block
    public function show(KhuVucBai $khuvucbai): JsonResponse
    {
        $obaiList = $khuvucbai->obai()
            ->with(['vitriHienTai.container' => function ($q) {
                $q->select('macontainer', 'socontainer', 'bi_hong', 'trangthai_haiquan', 'thoigian_vaobai');
            }])
            ->orderBy('tang')
            ->orderBy('hang')
            ->orderBy('khoang')
            ->get()
            ->map(fn ($o) => [
                'maobai'      => $o->maobai,
                'maobai_code' => $o->maobai_code,
                'khoang'      => $o->khoang,
                'hang'        => $o->hang,
                'tang'        => $o->tang,
                'trangthai'   => $o->trangthai,
                'container'   => $o->vitriHienTai?->container
                    ? [
                        'socontainer'       => $o->vitriHienTai->container->socontainer,
                        'bi_hong'           => (bool) $o->vitriHienTai->container->bi_hong,
                        'trangthai_haiquan' => $o->vitriHienTai->container->trangthai_haiquan,
                        'thoigian_vaobai'   => $o->vitriHienTai->container->thoigian_vaobai?->format('d/m/Y H:i'),
                    ]
                    : null,
            ]);

        return response()->json([
            'block' => [
                'makhuvuc'    => $khuvucbai->makhuvuc,
                'tenblock'    => $khuvucbai->tenblock,
                'sokhoang'    => $khuvucbai->sokhoang,
                'sohang'      => $khuvucbai->sohang,
                'sotang'      => $khuvucbai->sotang,
                'lablock_lanh' => (bool) $khuvucbai->lablock_lanh,
            ],
            'obai' => $obaiList,
        ]);
    }
}
