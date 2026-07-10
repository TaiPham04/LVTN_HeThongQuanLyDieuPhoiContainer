<?php

namespace App\Http\Controllers\KhachHang;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContainerResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\LogCong;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerKHController extends Controller
{
    // GET /api/kh/container
    public function index(Request $request): JsonResponse
    {
        $makh  = $request->user()->mataikhoan;
        $query = Container::with(['loaicontainer', 'chuyentau.hangtau'])
            ->where('makhachhang', $makh);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->whereNotIn('trangthai', ['khonghoatdong']);
        }

        if ($request->search) {
            $query->where('socontainer', 'like', "%{$request->search}%");
        }

        $data = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10), ['*'], 'trang', (int) $request->get('trang', 1));

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

    // GET /api/kh/container/{container}
    public function show(Request $request, Container $container): JsonResponse
    {
        if ($container->makhachhang !== $request->user()->mataikhoan) {
            return response()->json(['message' => 'Không có quyền truy cập.'], 403);
        }

        $container->load(['loaicontainer', 'chuyentau.hangtau']);

        // Timeline: lịch sử vào/ra
        $logs = LogCong::where('macontainer', $container->macontainer)
            ->orderBy('thoigian_xl')
            ->get()
            ->map(fn ($l) => [
                'loai'        => $l->kieu_xuatnhap === 'nhap' ? 'Nhập bãi' : 'Xuất cổng',
                'thoigian'    => $l->thoigian_xl?->format('d/m/Y H:i'),
                'ghichu'      => $l->ghichu,
            ]);

        // Vị trí hiện tại
        $vitri = LichSuViTri::with(['obai.khuvucbai'])
            ->where('macontainer', $container->macontainer)
            ->whereNull('thoigian_roi')
            ->latest('thoigian_gan')
            ->first();

        // Phí lưu bãi ước tính (đơn giản: số ngày × đơn giá theo loại)
        $soNgay   = null;
        $phiUocTinh = null;
        if ($container->thoigian_vaobai && $container->trangthai === 'trongbai') {
            $soNgay     = max(0, (int) $container->thoigian_vaobai->diffInDays(now()));
            $ngayMienPhi = 5;
            $ngayTinhPhi = max(0, $soNgay - $ngayMienPhi);
            $donGia      = str_contains($container->loaicontainer?->tenloai ?? '', '40') ? 200000 : 100000;
            $phiUocTinh  = $ngayTinhPhi * $donGia;
        }

        return response()->json([
            'data' => new ContainerResource($container),
            'vitri_hien_tai' => $vitri ? [
                'maobai_code' => $vitri->obai->maobai_code ?? null,
                'tenblock'    => $vitri->obai->khuvucbai->tenblock ?? null,
                'khoang'      => $vitri->obai->khoang ?? null,
                'hang'        => $vitri->obai->hang ?? null,
                'tang'        => $vitri->obai->tang ?? null,
            ] : null,
            'so_ngay_luu_bai' => $soNgay,
            'phi_uoc_tinh'    => $phiUocTinh,
            'timeline'        => $logs,
        ]);
    }
}
