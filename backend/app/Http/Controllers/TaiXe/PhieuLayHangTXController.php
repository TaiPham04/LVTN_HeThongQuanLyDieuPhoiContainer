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
