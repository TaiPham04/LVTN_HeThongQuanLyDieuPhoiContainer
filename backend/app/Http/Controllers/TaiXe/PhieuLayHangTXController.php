<?php

namespace App\Http\Controllers\TaiXe;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhieuLayHangResource;
use App\Models\PhieuLayHang;
use App\Models\TaiXe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PhieuLayHangTXController extends Controller
{
    // Lấy TaiXe record của tài xế đang đăng nhập
    private function getTaiXe(Request $request): ?TaiXe
    {
        return TaiXe::where('mataikhoan', $request->user()->mataikhoan)->first();
    }

    // GET /api/tx/phieu-lay-hang
    public function index(Request $request): JsonResponse
    {
        $taixe = $this->getTaiXe($request);

        if (!$taixe) {
            return response()->json(['message' => 'Không tìm thấy thông tin tài xế.'], 404);
        }

        // Tự động cập nhật hết hạn
        PhieuLayHang::where('mataixe', $taixe->mataixe)
            ->where('trangthai', 'cho_lay')
            ->where('thoigian_het_han', '<', now())
            ->update(['trangthai' => 'het_han']);

        $query = PhieuLayHang::with(['container.loaicontainer', 'container.chuyentau.hangtau'])
            ->where('mataixe', $taixe->mataixe);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        }

        $data = $query->orderByDesc('thoigian_xuat')->get();

        return response()->json([
            'data'   => PhieuLayHangResource::collection($data),
            'taixe'  => [
                'mataixe'     => $taixe->mataixe,
                'hoten'       => $taixe->hoten,
                'sodienthoai' => $taixe->sodienthoai,
                'biensoxe'    => $taixe->biensoxe,
            ],
        ]);
    }

    // PATCH /api/tx/phieu-lay-hang/{phieu}/den-cang
    public function denCang(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $taixe = $this->getTaiXe($request);

        if (!$taixe || $phieu->mataixe !== $taixe->mataixe) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        if ($phieu->trangthai !== 'cho_lay') {
            return response()->json(['message' => 'Phiếu không còn hiệu lực.'], 422);
        }

        if ($phieu->thoigian_den_cang) {
            return response()->json(['message' => 'Đã ghi nhận đến cảng trước đó.'], 422);
        }

        $phieu->update(['thoigian_den_cang' => now()]);

        return response()->json([
            'message' => 'Đã ghi nhận thời điểm đến cảng.',
            'thoigian_den_cang' => $phieu->fresh()->thoigian_den_cang?->format('d/m/Y H:i'),
        ]);
    }

    // PATCH /api/tx/phieu-lay-hang/{phieu}/lay-hang
    public function layHang(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $taixe = $this->getTaiXe($request);

        if (!$taixe || $phieu->mataixe !== $taixe->mataixe) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        if ($phieu->trangthai !== 'cho_lay') {
            return response()->json(['message' => 'Phiếu không còn hiệu lực.'], 422);
        }

        if (!$phieu->thoigian_den_cang) {
            return response()->json(['message' => 'Vui lòng xác nhận đến cảng trước.'], 422);
        }

        $phieu->update([
            'trangthai'    => 'da_lay',
            'thoigian_lay' => now(),
        ]);

        return response()->json([
            'message'      => 'Xác nhận lấy hàng thành công.',
            'thoigian_lay' => $phieu->fresh()->thoigian_lay?->format('d/m/Y H:i'),
        ]);
    }

    // GET /api/tx/phieu-lay-hang/{maphieu}
    public function show(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $taixe = $this->getTaiXe($request);

        if (!$taixe || $phieu->mataixe !== $taixe->mataixe) {
            return response()->json(['message' => 'Không có quyền truy cập phiếu này.'], 403);
        }

        if ($phieu->trangthai === 'cho_lay' && $phieu->thoigian_het_han < now()) {
            $phieu->update(['trangthai' => 'het_han']);
            $phieu->refresh();
        }

        return response()->json([
            'data' => new PhieuLayHangResource($phieu->load(['container.loaicontainer', 'container.chuyentau.hangtau'])),
        ]);
    }
}
