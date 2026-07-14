<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContainerResource;
use App\Http\Resources\LogCongResource;
use App\Models\Container;
use App\Models\LogCong;
use App\Models\PhieuLayHang;
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

        $data = $base->with(['container.chuyentau.hangtau', 'chuyentau', 'taixe', 'nhanvien'])
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

        $data = $base->with(['loaicontainer', 'chuyentau.hangtau'])
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
            ->join('chuyentau', 'container.machuyentau', '=', 'chuyentau.machuyentau')
            ->join('hangtau',   'chuyentau.mahangtau',   '=', 'hangtau.mahangtau')
            ->selectRaw("
                hangtau.mahangtau,
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

    // ─── GET /api/admin/bao-cao/ton-bai ──────────────────────────
    public function tonBai(Request $request): JsonResponse
    {
        $base = Container::where('trangthai', 'trongbai')
            ->whereNotNull('thoigian_vaobai');

        if ($request->tu) {
            $base->where('thoigian_vaobai', '>=', Carbon::parse($request->tu)->startOfDay());
        }
        if ($request->den) {
            $base->where('thoigian_vaobai', '<=', Carbon::parse($request->den)->endOfDay());
        }

        $containers = $base->with(['loaicontainer', 'chuyentau.hangtau'])->get();

        $now       = now();
        $phanLoai  = ['duoi_7' => 0, 'tu_7_14' => 0, 'tu_15_30' => 0, 'tren_30' => 0];

        $rows = $containers->map(function ($c) use ($now, &$phanLoai) {
            $days = (int) $c->thoigian_vaobai->diffInDays($now);

            if      ($days < 7)   $phanLoai['duoi_7']++;
            elseif  ($days < 15)  $phanLoai['tu_7_14']++;
            elseif  ($days <= 30) $phanLoai['tu_15_30']++;
            else                  $phanLoai['tren_30']++;

            return [
                'socontainer'     => $c->socontainer,
                'tenloai'         => $c->loaicontainer?->tenloai,
                'mascac'          => $c->chuyentau?->hangtau?->mascac,
                'sovoyage'        => $c->chuyentau?->sovoyage,
                'thoigian_vaobai' => $c->thoigian_vaobai?->format('d/m/Y H:i'),
                'so_ngay_ton'     => $days,
            ];
        })->sortByDesc('so_ngay_ton')->values();

        return response()->json([
            'phan_loai' => $phanLoai,
            'tong_ton'  => $containers->count(),
            'data'      => $rows,
        ]);
    }

    // ─── GET /api/admin/bao-cao/kpi ───────────────────────────────
    public function kpi(Request $request): JsonResponse
    {
        [$tu, $den] = $this->khoangNgay($request);

        // ── Dwell Time (ngày lưu bãi) ─────────────────────────────
        $dwell = Container::where('trangthai', 'xuatcong')
            ->whereBetween('thoigian_rabai', [$tu, $den])
            ->whereNotNull('thoigian_vaobai')
            ->whereNotNull('thoigian_rabai')
            ->selectRaw("
                COUNT(*)                                                                         AS so_container,
                ROUND(AVG(TIMESTAMPDIFF(HOUR, thoigian_vaobai, thoigian_rabai) / 24.0), 1)      AS tb,
                ROUND(MIN(TIMESTAMPDIFF(HOUR, thoigian_vaobai, thoigian_rabai) / 24.0), 1)      AS min_val,
                ROUND(MAX(TIMESTAMPDIFF(HOUR, thoigian_vaobai, thoigian_rabai) / 24.0), 1)      AS max_val,
                SUM(TIMESTAMPDIFF(DAY,  thoigian_vaobai, thoigian_rabai) < 7)                   AS d_duoi_7,
                SUM(TIMESTAMPDIFF(DAY,  thoigian_vaobai, thoigian_rabai) BETWEEN 7  AND 14)     AS d_7_14,
                SUM(TIMESTAMPDIFF(DAY,  thoigian_vaobai, thoigian_rabai) BETWEEN 15 AND 30)     AS d_15_30,
                SUM(TIMESTAMPDIFF(DAY,  thoigian_vaobai, thoigian_rabai) > 30)                  AS d_tren_30
            ")
            ->first();

        // ── Truck Turnaround Time (phút qua cổng) ─────────────────
        $turnaround = PhieuLayHang::where('trangthai', 'da_lay')
            ->whereBetween('thoigian_lay', [$tu, $den])
            ->whereNotNull('thoigian_vao_cong')
            ->whereNotNull('thoigian_lay')
            ->selectRaw("
                COUNT(*)                                                                           AS so_phieu,
                ROUND(AVG(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay)), 0)             AS tb,
                MIN(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay))                       AS min_val,
                MAX(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay))                       AS max_val,
                SUM(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay) < 30)                 AS t_duoi_30,
                SUM(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay) BETWEEN 30 AND 60)    AS t_30_60,
                SUM(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay) BETWEEN 61 AND 120)   AS t_60_120,
                SUM(TIMESTAMPDIFF(MINUTE, thoigian_vao_cong, thoigian_lay) > 120)                AS t_tren_120
            ")
            ->first();

        return response()->json([
            'dwell_time' => [
                'so_container' => (int)   ($dwell->so_container ?? 0),
                'trung_binh'   => (float) ($dwell->tb           ?? 0),
                'nho_nhat'     => (float) ($dwell->min_val      ?? 0),
                'lon_nhat'     => (float) ($dwell->max_val      ?? 0),
                'phan_bo'      => [
                    ['label' => '< 7 ngày',   'count' => (int)($dwell->d_duoi_7  ?? 0)],
                    ['label' => '7–14 ngày',  'count' => (int)($dwell->d_7_14   ?? 0)],
                    ['label' => '15–30 ngày', 'count' => (int)($dwell->d_15_30  ?? 0)],
                    ['label' => '> 30 ngày',  'count' => (int)($dwell->d_tren_30 ?? 0)],
                ],
            ],
            'turnaround_time' => [
                'so_phieu'   => (int)($turnaround->so_phieu  ?? 0),
                'trung_binh' => (int)($turnaround->tb        ?? 0),
                'nho_nhat'   => (int)($turnaround->min_val   ?? 0),
                'lon_nhat'   => (int)($turnaround->max_val   ?? 0),
                'phan_bo'    => [
                    ['label' => '< 30 phút',  'count' => (int)($turnaround->t_duoi_30  ?? 0)],
                    ['label' => '30–60 phút', 'count' => (int)($turnaround->t_30_60   ?? 0)],
                    ['label' => '1–2 giờ',    'count' => (int)($turnaround->t_60_120  ?? 0)],
                    ['label' => '> 2 giờ',    'count' => (int)($turnaround->t_tren_120 ?? 0)],
                ],
            ],
        ]);
    }

    // ─── Helper ───────────────────────────────────────────────────
    private function khoangNgay(Request $request): array
    {
        $tu  = $request->tu  ? Carbon::parse($request->tu)->startOfDay()  : Carbon::today()->subDays(29)->startOfDay();
        $den = $request->den ? Carbon::parse($request->den)->endOfDay()   : Carbon::today()->endOfDay();
        return [$tu, $den];
    }
}
