<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChuyenTau;
use App\Models\Container;
use App\Models\KhuVucBai;
use App\Models\LogCong;
use App\Models\OBai;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // ── Q1: Thống kê container ────────────────────────────────
        $cStats = Container::whereNot('trangthai', 'khonghoatdong')
            ->selectRaw("
                SUM(trangthai = 'trongbai')                              AS trong_bai,
                SUM(trangthai = 'dangky')                                AS dang_ky,
                SUM(trangthai = 'xuatcong')                              AS xuat_cong,
                SUM(trangthai = 'dalenken')                              AS xuat_cang,
                SUM(bi_hong = 1)                                         AS bi_hong,
                SUM(da_thong_quan = 0 AND trangthai_haiquan != 'chua_khai') AS cho_haiquan
            ")
            ->first();

        // ── Q2: Log cổng 7 ngày, gom thành biểu đồ ─────────────
        $from    = Carbon::today()->subDays(6)->startOfDay();
        $logRows = LogCong::selectRaw("DATE(thoigian_xl) AS ngay, kieu_xuatnhap, COUNT(*) AS sl")
            ->where('thoigian_xl', '>=', $from)
            ->groupBy('ngay', 'kieu_xuatnhap')
            ->get()
            ->groupBy('ngay');

        $today   = Carbon::today()->format('Y-m-d');
        $bieuDo  = [];
        $nhapTD  = 0;
        $xuatTD  = 0;

        for ($i = 6; $i >= 0; $i--) {
            $key   = Carbon::today()->subDays($i)->format('Y-m-d');
            $label = Carbon::today()->subDays($i)->format('d/m');
            $rows  = $logRows->get($key, collect());
            $nhap  = (int) ($rows->firstWhere('kieu_xuatnhap', 'nhap')?->sl ?? 0);
            $xuat  = (int) ($rows->firstWhere('kieu_xuatnhap', 'xuat')?->sl ?? 0);
            $bieuDo[] = ['ngay' => $label, 'nhap' => $nhap, 'xuat' => $xuat];
            if ($key === $today) { $nhapTD = $nhap; $xuatTD = $xuat; }
        }

        // ── Q3: Tỷ lệ lấp đầy toàn bãi ─────────────────────────
        $oBaiStats = OBai::selectRaw("COUNT(*) AS tong, SUM(trangthai = 'dangsudung') AS dung")->first();
        $tyLe = $oBaiStats->tong > 0
            ? round($oBaiStats->dung / $oBaiStats->tong * 100, 1)
            : 0;

        // ── Q4: Lấp đầy từng khu vực ────────────────────────────
        $khuVuc = KhuVucBai::hoatDong()
            ->withCount([
                'obai as tong_o',
                'obai as dang_dung' => fn ($q) => $q->where('trangthai', 'dangsudung'),
            ])
            ->orderBy('tenblock')
            ->get()
            ->map(fn ($k) => [
                'tenblock'  => $k->tenblock,
                'tong_o'    => (int) $k->tong_o,
                'dang_dung' => (int) $k->dang_dung,
                'ty_le'     => $k->tong_o > 0 ? round($k->dang_dung / $k->tong_o * 100, 1) : 0,
            ]);

        // ── Q5: Chuyến tàu sắp đến ───────────────────────────────
        $sapDen = ChuyenTau::with('hangtau')
            ->where('trangthai', 'dalenlich')
            ->orderBy('thoigiandukien')
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'sovoyage'       => $c->sovoyage,
                'tentau'         => $c->tentau,
                'mascac'         => $c->hangtau->mascac ?? null,
                'thoigiandukien' => $c->thoigiandukien?->format('d/m/Y H:i'),
            ]);

        return response()->json([
            'the_so' => [
                'container_trong_bai'     => (int) ($cStats->trong_bai   ?? 0),
                'nhap_hom_nay'            => $nhapTD,
                'xuat_hom_nay'            => $xuatTD,
                'ty_le_lap_day_phan_tram' => $tyLe,
                'chuyen_tau_hoat_dong'    => ChuyenTau::whereIn('trangthai', ['dalenlich', 'dadencang'])->count(),
                'container_cho_haiquan'   => (int) ($cStats->cho_haiquan ?? 0),
                'container_bi_hong'       => (int) ($cStats->bi_hong     ?? 0),
            ],
            'bieu_do_7_ngay'    => $bieuDo,
            'phan_bo_container' => [
                ['trangthai' => 'dangky',   'nhan' => 'Chờ vào bãi',  'so_luong' => (int) ($cStats->dang_ky   ?? 0)],
                ['trangthai' => 'trongbai', 'nhan' => 'Trong bãi',    'so_luong' => (int) ($cStats->trong_bai ?? 0)],
                ['trangthai' => 'xuatcong', 'nhan' => 'Đã xuất cổng', 'so_luong' => (int) ($cStats->xuat_cong ?? 0)],
                ['trangthai' => 'dalenken', 'nhan' => 'Xuất cảng',    'so_luong' => (int) ($cStats->xuat_cang ?? 0)],
            ],
            'lap_day_khu_vuc'    => $khuVuc,
            'chuyen_tau_sap_den' => $sapDen,
        ]);
    }
}
