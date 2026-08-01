<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChuyenTau\LuuChuyenTau;
use App\Http\Requests\ChuyenTau\XoaChuyenTau;
use App\Http\Resources\ChuyenTauResource;
use App\Models\ChuyenTau;
use App\Models\Container;
use App\Models\LogXoa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChuyenTauController extends Controller
{
    // ─── GET /api/admin/lich-tau ─────────────────────────────────
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
                      $q2->where('mascac',     'like', "%{$request->search}%")
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

    // ─── POST /api/admin/lich-tau ─────────────────────────────────
    public function store(LuuChuyenTau $request): JsonResponse
    {
        $chuyentau = ChuyenTau::create([
            ...$request->validated(),
            'trangthai' => 'dalenlich',
        ]);

        return response()->json([
            'message' => "Đã thêm chuyến tàu {$chuyentau->sovoyage} thành công.",
            'data'    => new ChuyenTauResource($chuyentau->load('hangtau')),
        ], 201);
    }

    // ─── PUT /api/admin/lich-tau/{chuyentau} ─────────────────────
    public function update(LuuChuyenTau $request, ChuyenTau $chuyentau): JsonResponse
    {
        if (in_array($chuyentau->trangthai, ['daroi', 'dahuy'])) {
            return response()->json([
                'message' => 'Không thể sửa chuyến tàu đã rời hoặc đã hủy.',
            ], 422);
        }

        $chuyentau->update($request->validated());

        return response()->json([
            'message' => 'Cập nhật lịch tàu thành công.',
            'data'    => new ChuyenTauResource($chuyentau->fresh()->load('hangtau')),
        ]);
    }

    // ─── PATCH /api/admin/lich-tau/{chuyentau}/trang-thai ────────
    public function chuyenTrangThai(ChuyenTau $chuyentau): JsonResponse
    {
        $buocTiep = [
            'dalenlich' => 'dadencang',
            'dadencang'  => 'daroi',
        ];

        if (!isset($buocTiep[$chuyentau->trangthai])) {
            return response()->json([
                'message' => 'Trạng thái hiện tại không thể chuyển tiếp.',
            ], 422);
        }

        $trangThaiMoi = $buocTiep[$chuyentau->trangthai];

        // L5: Không cho tàu rời bến khi còn container nhập của chuyến chưa được dỡ khỏi tàu.
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

    // ─── DELETE /api/admin/lich-tau/{chuyentau} ──────────────────
    public function destroy(XoaChuyenTau $request, ChuyenTau $chuyentau): JsonResponse
    {
        if ($chuyentau->trangthai === 'dahuy') {
            return response()->json(['message' => 'Chuyến tàu này đã được hủy trước đó.'], 422);
        }

        if ($chuyentau->trangthai === 'daroi') {
            return response()->json([
                'message' => 'Chuyến tàu đã hoàn thành (đã rời bến). Không thể hủy chuyến đã kết thúc.',
            ], 422);
        }

        if ($chuyentau->trangthai === 'dadencang') {
            return response()->json([
                'message' => 'Chuyến tàu đang ở cảng (đang xếp/dỡ hàng). Không thể hủy khi tàu đang hoạt động.',
            ], 422);
        }

        // Chỉ còn trạng thái dalenlich — kiểm tra container liên kết
        $soContainer = Container::where('machuyentau', $chuyentau->machuyentau)
            ->where('trangthai', '!=', 'khonghoatdong')
            ->count();

        if ($soContainer > 0) {
            return response()->json([
                'message' => "Không thể hủy. Chuyến tàu đang có {$soContainer} container liên kết. Hãy gỡ liên kết container trước.",
            ], 422);
        }

        $chuoiDungThan = "Delete {$chuyentau->sovoyage}";
        if ($request->xacnhan_xoa !== $chuoiDungThan) {
            return response()->json([
                'message' => "Chuỗi xác nhận không đúng. Vui lòng gõ: \"{$chuoiDungThan}\"",
            ], 422);
        }

        LogXoa::create([
            'loaidoituong' => 'chuyentau',
            'madoituong'   => $chuyentau->machuyentau,
            'tendoituong'  => "{$chuyentau->sovoyage} — {$chuyentau->tentau}",
            'nguoixoa'     => $request->user()->mataikhoan,
            'lydo_xoa'     => $request->lydo_xoa,
            'chuoixacnhan' => $request->xacnhan_xoa,
            'thoigian_xoa' => now(),
        ]);

        $chuyentau->update(['trangthai' => 'dahuy']);

        return response()->json([
            'message' => "Chuyến tàu {$chuyentau->sovoyage} đã được hủy thành công.",
        ]);
    }
}
