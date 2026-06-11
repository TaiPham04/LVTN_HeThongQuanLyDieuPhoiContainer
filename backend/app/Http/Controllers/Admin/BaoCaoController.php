<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContainerResource;
use App\Http\Resources\LogCongResource;
use App\Models\Container;
use App\Models\LogCong;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BaoCaoController extends Controller
{
    // ─── GET /api/admin/bao-cao/xuat-nhap ────────────────────────
    public function xuatNhap(Request $request): JsonResponse
    {
        [$tu, $den] = $this->khoangNgay($request);

        $base = LogCong::whereBetween('thoigian_xl', [$tu, $den]);

        $tongNhap = (clone $base)->where('kieu_xuatnhap', 'nhap')->count();
        $tongXuat = (clone $base)->where('kieu_xuatnhap', 'xuat')->count();

        if ($request->kieu) {
            $base->where('kieu_xuatnhap', $request->kieu);
        }

        $data = $base->with(['container.hangtau', 'chuyentau', 'taixe', 'nhanvien'])
                     ->orderBy('thoigian_xl', 'desc')
                     ->paginate($request->get('per_page', 20));

        return response()->json([
            'tom_tat' => ['tong_nhap' => $tongNhap, 'tong_xuat' => $tongXuat],
            'data'    => LogCongResource::collection($data->items()),
            'meta'    => [
                'tong'      => $data->total(),
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'per_page'  => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/admin/bao-cao/container ────────────────────────
    public function container(Request $request): JsonResponse
    {
        [$tu, $den] = $this->khoangNgay($request);

        $base = Container::whereNot('trangthai', 'khonghoatdong')
            ->whereBetween('created_at', [$tu, $den]);

        $tomTat = [
            'tong_dangky'   => (clone $base)->where('trangthai', 'dangky')->count(),
            'tong_trongbai' => (clone $base)->where('trangthai', 'trongbai')->count(),
            'tong_xuatcong' => (clone $base)->where('trangthai', 'xuatcong')->count(),
            'tong_bi_hong'  => (clone $base)->where('bi_hong', true)->count(),
        ];

        if ($request->trangthai) {
            $base->where('trangthai', $request->trangthai);
        }

        $data = $base->with(['loaicontainer', 'hangtau', 'chuyentau'])
                     ->orderBy('created_at', 'desc')
                     ->paginate($request->get('per_page', 20));

        return response()->json([
            'tom_tat' => $tomTat,
            'data'    => ContainerResource::collection($data->items()),
            'meta'    => [
                'tong'      => $data->total(),
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'per_page'  => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/admin/bao-cao/hang-tau ─────────────────────────
    public function hangTau(Request $request): JsonResponse
    {
        [$tu, $den] = $this->khoangNgay($request);

        $rows = Container::whereNot('container.trangthai', 'khonghoatdong')
            ->whereBetween('container.created_at', [$tu, $den])
            ->join('hangtau', 'container.mahangtau', '=', 'hangtau.mahangtau')
            ->selectRaw("
                hangtau.mascac,
                hangtau.tenhangtau,
                COUNT(*)                                       AS tong,
                SUM(container.trangthai = 'trongbai')         AS trong_bai,
                SUM(container.trangthai = 'xuatcong')         AS xuat_cong,
                SUM(container.bi_hong   = 1)                  AS bi_hong
            ")
            ->groupBy('hangtau.mahangtau', 'hangtau.mascac', 'hangtau.tenhangtau')
            ->orderByDesc('tong')
            ->get();

        return response()->json(['data' => $rows]);
    }

    // ─── Helper ───────────────────────────────────────────────────
    private function khoangNgay(Request $request): array
    {
        $tu  = $request->tu  ? Carbon::parse($request->tu)->startOfDay()  : Carbon::today()->subDays(29)->startOfDay();
        $den = $request->den ? Carbon::parse($request->den)->endOfDay()   : Carbon::today()->endOfDay();
        return [$tu, $den];
    }
}
