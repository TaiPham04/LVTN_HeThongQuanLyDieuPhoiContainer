<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChuyenTau\LuuChuyenTau;
use App\Http\Requests\ChuyenTau\XoaChuyenTau;
use App\Http\Resources\ChuyenTauResource;
use App\Models\ChuyenTau;
use App\Models\LogXoa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ChuyenTauController extends Controller
{
    // ─── GET /api/admin/lich-tau ─────────────────────────────────
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
                      $q2->where('mascac',     'like', "%{$request->search}%")
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

    // ─── DELETE /api/admin/lich-tau/{chuyentau} ──────────────────
    public function destroy(XoaChuyenTau $request, ChuyenTau $chuyentau): JsonResponse
    {
        if ($chuyentau->trangthai === 'dahuy') {
            return response()->json(['message' => 'Chuyến tàu này đã được hủy trước đó.'], 422);
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
