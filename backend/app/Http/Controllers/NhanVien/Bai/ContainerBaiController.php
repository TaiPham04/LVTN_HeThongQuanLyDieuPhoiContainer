<?php

namespace App\Http\Controllers\NhanVien\Bai;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContainerResource;
use App\Models\ChuyenTau;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContainerBaiController extends Controller
{
    // ─── GET /api/nv/bai/container ───────────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Container::with(['loaicontainer', 'chuyentau.hangtau']);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->whereNotIn('trangthai', ['khonghoatdong']);
        }

        if ($request->machuyentau) {
            $query->where('machuyentau', $request->machuyentau);
        }

        if ($request->loai_hinh) {
            $query->where('loai_hinh', $request->loai_hinh);
        }

        if ($request->search) {
            $query->where('socontainer', 'like', "%{$request->search}%");
        }

        $data = $query->orderBy('socontainer')
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => ContainerResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/nv/bai/container/{container} ───────────────────────────────
    public function show(Container $container): JsonResponse
    {
        return response()->json([
            'data' => new ContainerResource($container->load(['loaicontainer', 'chuyentau.hangtau'])),
        ]);
    }

    // ─── GET /api/nv/bai/tally/{machuyentau} ─────────────────────────────────
    // Danh sách container nhập của chuyến tàu để NV Bãi tally
    public function danhSachTally(int $machuyentau): JsonResponse
    {
        $chuyen = ChuyenTau::with('hangtau')->findOrFail($machuyentau);

        $containers = Container::with('loaicontainer')
            ->where('machuyentau', $machuyentau)
            ->where('loai_hinh', 'nhap')
            ->orderBy('socontainer')
            ->get()
            ->map(fn ($c) => [
                'macontainer'   => $c->macontainer,
                'socontainer'   => $c->socontainer,
                'tenloai'       => $c->loaicontainer?->tenloai,
                'soniemchi'     => $c->soniemchi,
                'trongluong_kg' => $c->trongluong_kg,
                'mota_hanghoa'  => $c->mota_hanghoa,
                'trangthai'     => $c->trangthai,
                'bi_hong'       => (bool) $c->bi_hong,
                'ghichu_hong'   => $c->ghichu_hong,
                'thoigian_vaobai' => $c->thoigian_vaobai?->format('Y-m-d H:i'),
            ]);

        $stats = [
            'tong'        => $containers->count(),
            'choxacnhan'  => $containers->where('trangthai', 'choxacnhan')->count(),
            'trongbai'    => $containers->where('trangthai', 'trongbai')->count(),
            'bi_hong'     => $containers->where('bi_hong', true)->count(),
        ];

        return response()->json([
            'chuyentau'  => [
                'machuyentau'   => $chuyen->machuyentau,
                'sovoyage'      => $chuyen->sovoyage,
                'tentau'        => $chuyen->tentau,
                'tenhangtau'    => $chuyen->hangtau?->tenhangtau,
                'trangthai'     => $chuyen->trangthai,
            ],
            'data'  => $containers,
            'stats' => $stats,
        ]);
    }

    // ─── PATCH /api/nv/bai/tally/{container}/xac-nhan ────────────────────────
    // Xác nhận 1 container đã tiếp nhận vào bãi
    public function xacNhan(Container $container): JsonResponse
    {
        if ($container->trangthai !== 'choxacnhan') {
            return response()->json(['message' => 'Container này không ở trạng thái chờ xác nhận.'], 422);
        }

        $container->update([
            'trangthai'      => 'trongbai',
            'thoigian_vaobai' => now(),
        ]);

        return response()->json(['message' => "Đã xác nhận {$container->socontainer} vào bãi."]);
    }

    // ─── POST /api/nv/bai/tally/{machuyentau}/xac-nhan-loat ──────────────────
    // Xác nhận toàn bộ container choxacnhan của chuyến tàu
    public function xacNhanLoat(int $machuyentau): JsonResponse
    {
        $chuyen = ChuyenTau::findOrFail($machuyentau);

        if ($chuyen->trangthai !== 'dadencang') {
            return response()->json(['message' => 'Chuyến tàu phải đang ở trạng thái "Đã đến cảng".'], 422);
        }

        $soLuong = Container::where('machuyentau', $machuyentau)
            ->where('loai_hinh', 'nhap')
            ->where('trangthai', 'choxacnhan')
            ->update([
                'trangthai'      => 'trongbai',
                'thoigian_vaobai' => now(),
            ]);

        return response()->json([
            'message' => "Đã xác nhận {$soLuong} container vào bãi.",
            'so_luong' => $soLuong,
        ]);
    }

    // ─── PATCH /api/nv/bai/tally/{container}/tinh-trang ─────────────────────
    // Cập nhật tình trạng container: bi_hong + ghichu
    public function capNhatTinhTrang(Request $request, Container $container): JsonResponse
    {
        $request->validate([
            'bi_hong'     => ['required', 'boolean'],
            'ghichu_hong' => ['nullable', 'string', 'max:500'],
        ]);

        $container->update([
            'bi_hong'     => $request->bi_hong,
            'ghichu_hong' => $request->ghichu_hong,
        ]);

        $tinhTrang = $request->bi_hong ? 'hư hỏng' : 'bình thường';
        return response()->json(['message' => "Đã cập nhật tình trạng {$container->socontainer}: {$tinhTrang}."]);
    }
}
