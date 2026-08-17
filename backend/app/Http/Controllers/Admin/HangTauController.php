<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\HangTau\LuuHangTau;
use App\Http\Requests\HangTau\XoaHangTau;
use App\Http\Resources\HangTauResource;
use App\Models\HangTau;
use App\Models\LogXoa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HangTauController extends Controller
{
    // ─── GET /api/admin/hang-tau ──────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        // "dang_su_dung" đúng theo điều kiện chặn xóa ở dangDuocSuDung() — dùng để
        // frontend biết trước mà làm mờ nút Xóa, tránh bấm xong mới báo lỗi.
        $query = HangTau::withCount(['chuyentau as so_chuyen_tau_active' => function ($q) {
            $q->whereIn('trangthai', ['dalenlich', 'dadencang']);
        }]);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->where('trangthai', 'hoatdong');
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('mascac', 'like', "%{$request->search}%")
                  ->orWhere('tenhangtau', 'like', "%{$request->search}%")
                  ->orWhere('quocgia', 'like', "%{$request->search}%");
            });
        }

        $data = $query->orderBy('mascac')->paginate($request->get('per_page', 10));

        return response()->json([
            'data' => HangTauResource::collection($data->items()),
            'meta' => [
                'tong'       => $data->total(),
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/admin/hang-tau/{hangtau} ────────────────────────
    public function show(HangTau $hangtau): JsonResponse
    {
        return response()->json(['data' => new HangTauResource($hangtau)]);
    }

    // ─── POST /api/admin/hang-tau ─────────────────────────────────
    public function store(LuuHangTau $request): JsonResponse
    {
        $hangtau = HangTau::create([
            ...$request->validated(),
            'trangthai' => 'hoatdong',
        ]);

        return response()->json([
            'message' => 'Thêm hãng tàu thành công.',
            'data'    => new HangTauResource($hangtau),
        ], 201);
    }

    // ─── PUT /api/admin/hang-tau/{hangtau} ────────────────────────
    public function update(LuuHangTau $request, HangTau $hangtau): JsonResponse
    {
        if ($hangtau->trangthai === 'khonghoatdong') {
            return response()->json([
                'message' => 'Không thể sửa hãng tàu đã bị vô hiệu hóa.',
            ], 422);
        }

        $hangtau->update($request->validated());

        return response()->json([
            'message' => 'Cập nhật hãng tàu thành công.',
            'data'    => new HangTauResource($hangtau->fresh()),
        ]);
    }

    // ─── DELETE /api/admin/hang-tau/{hangtau} ─────────────────────
    public function destroy(XoaHangTau $request, HangTau $hangtau): JsonResponse
    {
        if ($hangtau->dangDuocSuDung()) {
            $soChuyenTau  = $hangtau->chuyentau()->count();
            $soContainer  = $hangtau->containers()->count();
            return response()->json([
                'message' => "Không thể xóa. Hãng tàu này đang có {$soChuyenTau} chuyến tàu và {$soContainer} container liên quan.",
            ], 422);
        }

        $chuoiDungThan = "Delete {$hangtau->mascac}";
        if ($request->xacnhan_xoa !== $chuoiDungThan) {
            return response()->json([
                'message' => "Chuỗi xác nhận không đúng. Vui lòng gõ: \"{$chuoiDungThan}\"",
            ], 422);
        }

        LogXoa::create([
            'loaidoituong' => 'hangtau',
            'madoituong'   => $hangtau->mahangtau,
            'tendoituong'  => "{$hangtau->mascac} — {$hangtau->tenhangtau}",
            'nguoixoa'     => $request->user()->mataikhoan,
            'lydo_xoa'     => $request->lydo_xoa,
            'chuoixacnhan' => $request->xacnhan_xoa,
            'thoigian_xoa' => now(),
        ]);

        $hangtau->update(['trangthai' => 'khonghoatdong']);

        return response()->json([
            'message' => "Hãng tàu {$hangtau->mascac} đã được vô hiệu hóa thành công.",
        ]);
    }

    // ─── PATCH /api/admin/hang-tau/{hangtau}/khoiphuc ────────────
    public function khoiPhuc(HangTau $hangtau): JsonResponse
    {
        if ($hangtau->trangthai === 'hoatdong') {
            return response()->json(['message' => 'Hãng tàu này đang hoạt động.'], 422);
        }

        $hangtau->update(['trangthai' => 'hoatdong']);

        return response()->json([
            'message' => "Đã khôi phục hãng tàu {$hangtau->mascac}.",
            'data'    => new HangTauResource($hangtau->fresh()),
        ]);
    }
}