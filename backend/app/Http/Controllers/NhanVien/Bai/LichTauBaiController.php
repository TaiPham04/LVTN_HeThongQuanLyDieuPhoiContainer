<?php

namespace App\Http\Controllers\NhanVien\Bai;

use App\Http\Controllers\Controller;
use App\Http\Resources\ChuyenTauResource;
use App\Models\ChuyenTau;
use App\Models\Container;
use App\Models\LogCong;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LichTauBaiController extends Controller
{
    // ─── GET /api/nv/bai/lich-tau ───────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = ChuyenTau::with(['hangtau', 'containers']);

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
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // ─── PATCH /api/nv/bai/lich-tau/{chuyentau}/trang-thai ──────
    public function chuyenTrangThai(ChuyenTau $chuyentau): JsonResponse
    {
        $buocTiep = [
            'dalenlich' => 'dadencang',
            'dadencang' => 'daroi',
        ];

        if (!isset($buocTiep[$chuyentau->trangthai])) {
            return response()->json(['message' => 'Trạng thái hiện tại không thể chuyển tiếp.'], 422);
        }

        $trangThaiMoi = $buocTiep[$chuyentau->trangthai];

        if ($trangThaiMoi === 'daroi') {
            $soChoDo = Container::where('machuyentau', $chuyentau->machuyentau)
                ->where('trangthai', 'dangky')
                ->count();

            if ($soChoDo > 0) {
                return response()->json([
                    'message' => "Còn {$soChoDo} container chưa được dỡ khỏi tàu. Vui lòng xác nhận dỡ hàng trước khi ghi nhận tàu rời bến.",
                ], 422);
            }
        }

        $chuyentau->update(['trangthai' => $trangThaiMoi]);

        $nhan = match($trangThaiMoi) {
            'dadencang' => 'đã đến cảng',
            'daroi'     => 'đã rời bến',
            default     => $trangThaiMoi,
        };

        return response()->json([
            'message' => "Chuyến tàu {$chuyentau->sovoyage} {$nhan}.",
            'data'    => new ChuyenTauResource($chuyentau->fresh()->load('hangtau')),
        ]);
    }

    // ─── POST /api/nv/bai/lich-tau/{chuyentau}/xac-nhan-do-hang ─
    public function xacNhanDoHang(Request $request, ChuyenTau $chuyentau): JsonResponse
    {
        if ($chuyentau->trangthai !== 'dadencang') {
            return response()->json(['message' => 'Chỉ có thể xác nhận dỡ hàng khi tàu đang ở trạng thái "Đã đến cảng".'], 422);
        }

        $containers = Container::where('machuyentau', $chuyentau->machuyentau)
            ->where('trangthai', 'dangky')
            ->get();

        if ($containers->isEmpty()) {
            return response()->json(['message' => 'Không còn container nào chờ dỡ hàng cho chuyến này.'], 422);
        }

        $manhanvien = $request->user()->mataikhoan;
        $now        = now();

        DB::transaction(function () use ($chuyentau, $containers, $manhanvien, $now) {
            foreach ($containers as $container) {
                LogCong::create([
                    'macontainer'   => $container->macontainer,
                    'machuyentau'   => $chuyentau->machuyentau,
                    'mataixe'       => null,
                    'manhanvien'    => $manhanvien,
                    'kieu_xuatnhap' => 'nhap',
                    'biensoxe'      => null,
                    'niemchi_ktra'  => null,
                    'niemchi_ok'    => true,
                    'haiquan_ok'    => false,
                    'ghichu'        => "Dỡ hàng từ tàu — chuyến {$chuyentau->sovoyage}",
                    'thoigian_xl'   => $now,
                ]);

                $container->update([
                    'trangthai'       => 'trongbai',
                    'thoigian_vaobai' => $now,
                ]);
            }
        });

        return response()->json([
            'message'           => "Đã xác nhận dỡ hàng {$containers->count()} container từ chuyến {$chuyentau->sovoyage} vào bãi.",
            'so_container_nhap' => $containers->count(),
            'data'              => new ChuyenTauResource($chuyentau->fresh()->load('hangtau')),
        ]);
    }
}
