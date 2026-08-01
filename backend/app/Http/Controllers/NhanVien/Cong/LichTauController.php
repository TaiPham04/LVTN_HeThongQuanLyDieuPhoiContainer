<?php

namespace App\Http\Controllers\NhanVien\Cong;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChuyenTauResource;
use App\Models\ChuyenTau;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LichTauController extends Controller
{
    // ─── GET /api/nv/cong/lich-tau ───────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = ChuyenTau::with('hangtau');

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->whereIn('trangthai', ['dalenlich', 'dadencang']);
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
                      ->paginate($request->get('per_page', 10), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => ChuyenTauResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── PATCH /api/nv/cong/lich-tau/{chuyentau}/trang-thai ──────
    public function chuyenTrangThai(ChuyenTau $chuyentau): JsonResponse
    {
        $buocTiep = [
            'dalenlich' => 'dadencang',
            'dadencang'  => 'daroi',
        ];

        if (!isset($buocTiep[$chuyentau->trangthai])) {
            return response()->json(['message' => 'Trạng thái hiện tại không thể chuyển tiếp.'], 422);
        }

        $trangThaiMoi = $buocTiep[$chuyentau->trangthai];

        // Không cho tàu rời bến khi còn container nhập của chuyến chưa được dỡ khỏi tàu.
        // Container xuất còn trong bãi không chặn — chúng sẽ tự chuyển "đã lên tàu" bên dưới.
        if ($trangThaiMoi === 'daroi') {
            $soConLai = Container::where('machuyentau', $chuyentau->machuyentau)
                ->where('loai_hinh', 'nhap')
                ->where('trangthai', 'choxacnhan')
                ->count();

            if ($soConLai > 0) {
                return response()->json([
                    'message' => "Không thể xác nhận tàu rời bến. Còn {$soConLai} container của chuyến này chưa được dỡ khỏi tàu.",
                ], 422);
            }
        }

        DB::transaction(function () use ($chuyentau, $trangThaiMoi) {
            $chuyentau->update(['trangthai' => $trangThaiMoi]);

            if ($trangThaiMoi === 'daroi') {
                // Container xuất đăng ký cho chuyến này coi như đã lên tàu khi tàu rời bến
                Container::where('machuyentau', $chuyentau->machuyentau)
                    ->where('loai_hinh', 'xuat')
                    ->where('trangthai', 'trongbai')
                    ->update(['trangthai' => 'dalenken', 'thoigian_rabai' => now()]);
            }
        });

        $nhan = match($trangThaiMoi) {
            'dadencang' => 'đã đến cảng',
            'daroi'    => 'đã rời bến',
            default    => $trangThaiMoi,
        };

        return response()->json([
            'message' => "Chuyến tàu {$chuyentau->sovoyage} {$nhan}.",
            'data'    => new ChuyenTauResource($chuyentau->fresh()->load('hangtau')),
        ]);
    }
}
