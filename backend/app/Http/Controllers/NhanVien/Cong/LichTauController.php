<?php

namespace App\Http\Controllers\NhanVien\Cong;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChuyenTauResource;
use App\Models\ChuyenTau;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LichTauController extends Controller
{
    // ─── GET /api/nv/cong/lich-tau ───────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = ChuyenTau::with('hangtau');

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->whereIn('trangthai', ['dalenlich', 'dadencan']);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('sovoyage', 'like', "%{$request->search}%")
                  ->orWhere('tentau',  'like', "%{$request->search}%")
                  ->orWhereHas('hangtau', fn ($q2) =>
                      $q2->where('mascac',      'like', "%{$request->search}%")
                         ->orWhere('tenhangtau', 'like', "%{$request->search}%")
                  );
            });
        }

        $data = $query->orderBy('thoigiandukien', 'desc')
                      ->paginate($request->get('per_page', 10));

        return response()->json([
            'data' => ChuyenTauResource::collection($data->items()),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'total'        => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── PATCH /api/nv/cong/lich-tau/{chuyentau}/trang-thai ──────
    public function chuyenTrangThai(ChuyenTau $chuyentau): JsonResponse
    {
        $buocTiep = [
            'dalenlich' => 'dadencan',
            'dadencan'  => 'daroi',
        ];

        if (!isset($buocTiep[$chuyentau->trangthai])) {
            return response()->json(['message' => 'Trạng thái hiện tại không thể chuyển tiếp.'], 422);
        }

        $trangThaiMoi = $buocTiep[$chuyentau->trangthai];
        $chuyentau->update(['trangthai' => $trangThaiMoi]);

        $nhan = match($trangThaiMoi) {
            'dadencan' => 'đã đến cảng',
            'daroi'    => 'đã rời bến',
            default    => $trangThaiMoi,
        };

        return response()->json([
            'message' => "Chuyến tàu {$chuyentau->sovoyage} {$nhan}.",
            'data'    => new ChuyenTauResource($chuyentau->fresh()->load('hangtau')),
        ]);
    }
}
