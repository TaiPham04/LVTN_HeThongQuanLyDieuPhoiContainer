<?php

namespace App\Http\Controllers\KhachHang;

use App\Http\Controllers\Controller;
use App\Models\Container;
use App\Models\PhieuLayHang;
use App\Models\ChuyenTau;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardKHController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        // ── Thống kê container ────────────────────────────────────
        $stats = Container::where('makhachhang', $makh)
            ->whereNotIn('trangthai', ['khonghoatdong'])
            ->selectRaw("
                COUNT(*) AS tong,
                SUM(trangthai = 'dangky')   AS dang_ky,
                SUM(trangthai = 'trongbai') AS trong_bai,
                SUM(trangthai = 'xuatcong') AS xuat_cong
            ")
            ->first();

        // ── Phiếu lấy hàng chờ xử lý ────────────────────────────
        // Tự động hết hạn
        PhieuLayHang::whereHas('container', fn ($q) => $q->where('makhachhang', $makh))
            ->where('trangthai', 'cho_lay')
            ->where('thoigian_het_han', '<', now())
            ->update(['trangthai' => 'het_han']);

        $soPhieuChoDo = PhieuLayHang::whereHas('container', fn ($q) => $q->where('makhachhang', $makh))
            ->where('trangthai', 'cho_lay')
            ->count();

        // ── Container đang trong bãi (tối đa 5) ──────────────────
        $trongBai = Container::with(['loaicontainer', 'chuyentau.hangtau'])
            ->where('makhachhang', $makh)
            ->where('trangthai', 'trongbai')
            ->orderByDesc('thoigian_vaobai')
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'macontainer'    => $c->macontainer,
                'socontainer'    => $c->socontainer,
                'tenloai'        => $c->loaicontainer->tenloai ?? null,
                'sovoyage'       => $c->chuyentau->sovoyage ?? null,
                'thoigian_vaobai' => $c->thoigian_vaobai?->format('d/m/Y H:i'),
                'so_ngay'        => $c->thoigian_vaobai ? (int) $c->thoigian_vaobai->diffInDays(now()) : null,
            ]);

        // ── Chuyến tàu sắp đến có container của KH ───────────────
        $chuyenSapDen = ChuyenTau::with('hangtau')
            ->whereIn('trangthai', ['dalenlich', 'dadencang'])
            ->whereHas('containers', fn ($q) => $q->where('makhachhang', $makh)->where('trangthai', 'dangky'))
            ->withCount(['containers as so_cont_dangky' => fn ($q) => $q->where('makhachhang', $makh)->where('trangthai', 'dangky')])
            ->orderBy('thoigiandukien')
            ->limit(5)
            ->get()
            ->map(fn ($ct) => [
                'machuyentau'    => $ct->machuyentau,
                'sovoyage'       => $ct->sovoyage,
                'tentau'         => $ct->tentau,
                'mascac'         => $ct->hangtau->mascac ?? null,
                'thoigiandukien' => $ct->thoigiandukien?->format('d/m/Y H:i'),
                'trangthai'      => $ct->trangthai,
                'so_cont_dangky' => $ct->so_cont_dangky,
            ]);

        // ── Cảnh báo Free Time ───────────────────────────────────
        // Free time = 5 ngày miễn phí, đơn giá: 20ft=100k/ngày, 40ft=200k/ngày
        $FREE_DAYS = 5;

        $contTrongBaiAll = Container::with(['loaicontainer'])
            ->where('makhachhang', $makh)
            ->where('trangthai', 'trongbai')
            ->whereNotNull('thoigian_vaobai')
            ->get();

        $sapQuaFreeTime = [];
        $daQuaFreeTime  = [];

        foreach ($contTrongBaiAll as $c) {
            $soNgay    = (int) $c->thoigian_vaobai->diffInDays(now());
            $conLai    = $FREE_DAYS - $soNgay;
            $is40ft    = str_contains($c->loaicontainer?->tenloai ?? '', '40');
            $donGia    = $is40ft ? 200000 : 100000;
            $ngayTinhPhi = max(0, $soNgay - $FREE_DAYS);
            $phiUocTinh  = $ngayTinhPhi * $donGia;

            $item = [
                'macontainer'  => $c->macontainer,
                'socontainer'  => $c->socontainer,
                'tenloai'      => $c->loaicontainer->tenloai ?? null,
                'so_ngay'      => $soNgay,
                'ngay_tinh_phi'=> $ngayTinhPhi,
                'phi_uoc_tinh' => $phiUocTinh,
                'don_gia'      => $donGia,
            ];

            if ($soNgay > $FREE_DAYS) {
                $daQuaFreeTime[] = $item;
            } elseif ($conLai <= 2) {
                // Còn ≤ 2 ngày là cảnh báo sắp quá
                $sapQuaFreeTime[] = array_merge($item, ['con_lai' => $conLai]);
            }
        }

        // Sắp xếp: đã quá → nhiều ngày nhất trước, sắp quá → ít ngày còn lại nhất trước
        usort($daQuaFreeTime,  fn ($a, $b) => $b['so_ngay'] - $a['so_ngay']);
        usort($sapQuaFreeTime, fn ($a, $b) => $a['con_lai'] - $b['con_lai']);

        // ── Phiếu lấy hàng gần nhất (5) ──────────────────────────
        $phieuGanNhat = PhieuLayHang::with(['container', 'taixe'])
            ->whereHas('container', fn ($q) => $q->where('makhachhang', $makh))
            ->orderByDesc('thoigian_xuat')
            ->limit(5)
            ->get()
            ->map(fn ($p) => [
                'maphieu'       => $p->maphieu,
                'socontainer'   => $p->container->socontainer ?? null,
                'biensoxe'      => $p->biensoxe,
                'hoten_taixe'   => $p->taixe->hoten ?? null,
                'trangthai'     => $p->trangthai,
                'thoigian_xuat' => $p->thoigian_xuat?->format('d/m/Y H:i'),
            ]);

        return response()->json([
            'the_so' => [
                'tong_container'   => (int) ($stats->tong     ?? 0),
                'dang_ky'          => (int) ($stats->dang_ky  ?? 0),
                'trong_bai'        => (int) ($stats->trong_bai ?? 0),
                'xuat_cong'        => (int) ($stats->xuat_cong ?? 0),
                'phieu_cho_xuly'   => $soPhieuChoDo,
            ],
            'container_trong_bai' => $trongBai,
            'chuyen_sap_den'      => $chuyenSapDen,
            'phieu_gan_nhat'      => $phieuGanNhat,
            'canh_bao_freetime'   => [
                'sap_qua' => $sapQuaFreeTime,
                'da_qua'  => $daQuaFreeTime,
            ],
        ]);
    }
}
