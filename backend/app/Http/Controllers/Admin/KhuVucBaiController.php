<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\KhuVucBai\LuuKhuVucBai;
use App\Http\Requests\KhuVucBai\XoaKhuVucBai;
use App\Http\Resources\KhuVucBaiResource;
use App\Models\KhuVucBai;
use App\Models\LogXoa;
use App\Models\OBai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class KhuVucBaiController extends Controller
{
    // ─── GET /api/admin/khu-vuc-bai ──────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = KhuVucBai::query();

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->where('trangthai', 'hoatdong');
        }

        if ($request->search) {
            $query->where('tenblock', 'like', "%{$request->search}%");
        }

        if ($request->has('lablock_lanh')) {
            $query->where('lablock_lanh', $request->boolean('lablock_lanh'));
        }

        $data = $query->orderBy('tenblock')->paginate($request->get('per_page', 10));

        return response()->json([
            'data' => KhuVucBaiResource::collection($data->items()),
            'meta' => [
                'tong'       => $data->total(),
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/admin/khu-vuc-bai/{khuvucbai} ──────────────────
    public function show(KhuVucBai $khuvucbai): JsonResponse
    {
        return response()->json(['data' => new KhuVucBaiResource($khuvucbai)]);
    }

    // ─── POST /api/admin/khu-vuc-bai ─────────────────────────────
    // Tạo block mới + tự động tạo ô bãi theo Bay × Row × Tier
    public function store(LuuKhuVucBai $request): JsonResponse
    {
        DB::transaction(function () use ($request, &$khuvucbai) {
            $khuvucbai = KhuVucBai::create([
                ...$request->validated(),
                'soocamlanh' => $request->lablock_lanh ? $request->soocamlanh : 0,
                'trangthai'  => 'hoatdong',
            ]);

            // Tự động tạo ô bãi theo sokhoang × sohang × sotang
            $this->taoOBaiTuDong($khuvucbai);
        });

        return response()->json([
            'message' => "Block {$khuvucbai->tenblock} đã được tạo với {$khuvucbai->tongSoO()} ô bãi.",
            'data'    => new KhuVucBaiResource($khuvucbai),
        ], 201);
    }

    // ─── PUT /api/admin/khu-vuc-bai/{khuvucbai} ──────────────────
    public function update(LuuKhuVucBai $request, KhuVucBai $khuvucbai): JsonResponse
    {
        if ($khuvucbai->trangthai === 'khonghoatdong') {
            return response()->json([
                'message' => 'Không thể sửa khu vực bãi đã bị vô hiệu hóa.',
            ], 422);
        }

        $soKhoangCu = $khuvucbai->sokhoang;
        $soHangCu   = $khuvucbai->sohang;
        $soTangCu   = $khuvucbai->sotang;

        $khuvucbai->update([
            ...$request->validated(),
            'soocamlanh' => $request->lablock_lanh ? $request->soocamlanh : 0,
        ]);

        // Nếu kích thước thay đổi → cảnh báo (không tự xóa ô cũ vì có thể đang chứa container)
        $kichThuocThayDoi = $soKhoangCu !== $khuvucbai->sokhoang
            || $soHangCu !== $khuvucbai->sohang
            || $soTangCu !== $khuvucbai->sotang;

        $canh_bao = null;
        if ($kichThuocThayDoi) {
            $canh_bao = 'Kích thước block đã thay đổi. Các ô bãi mới sẽ được tạo thêm nếu cần. Ô bãi cũ vẫn giữ nguyên.';
            $this->taoOBaiBoSung($khuvucbai);
        }

        return response()->json([
            'message'   => 'Cập nhật khu vực bãi thành công.' . ($canh_bao ? " {$canh_bao}" : ''),
            'data'      => new KhuVucBaiResource($khuvucbai->fresh()),
        ]);
    }

    // ─── DELETE /api/admin/khu-vuc-bai/{khuvucbai} ───────────────
    public function destroy(XoaKhuVucBai $request, KhuVucBai $khuvucbai): JsonResponse
    {
        // Kiểm tra có container đang trong block không
        if ($khuvucbai->dangCoContainer()) {
            $soContainer = $khuvucbai->soODangSuDung();
            return response()->json([
                'message' => "Không thể xóa. Block {$khuvucbai->tenblock} đang có {$soContainer} container.",
            ], 422);
        }

        $chuoiDungThan = "Delete {$khuvucbai->tenblock}";
        if ($request->xacnhan_xoa !== $chuoiDungThan) {
            return response()->json([
                'message' => "Chuỗi xác nhận không đúng. Vui lòng gõ: \"{$chuoiDungThan}\"",
            ], 422);
        }

        LogXoa::create([
            'loaidoituong' => 'khuvucbai',
            'madoituong'   => $khuvucbai->makhuvuc,
            'tendoituong'  => "Block {$khuvucbai->tenblock}",
            'nguoixoa'     => $request->user()->mataikhoan,
            'lydo_xoa'     => $request->lydo_xoa,
            'chuoixacnhan' => $request->xacnhan_xoa,
            'thoigian_xoa' => now(),
        ]);

        $khuvucbai->update(['trangthai' => 'khonghoatdong']);
        $khuvucbai->obai()->update(['trangthai' => 'khonghoatdong']);

        return response()->json([
            'message' => "Block {$khuvucbai->tenblock} đã được vô hiệu hóa thành công.",
        ]);
    }

    // ─── PATCH /api/admin/khu-vuc-bai/{khuvucbai}/khoiphuc ───────
    public function khoiPhuc(KhuVucBai $khuvucbai): JsonResponse
    {
        if ($khuvucbai->trangthai === 'hoatdong') {
            return response()->json(['message' => 'Block này đang hoạt động.'], 422);
        }

        $khuvucbai->update(['trangthai' => 'hoatdong']);
        $khuvucbai->obai()->where('trangthai', 'khonghoatdong')->update(['trangthai' => 'trong']);

        return response()->json([
            'message' => "Đã khôi phục block {$khuvucbai->tenblock}.",
            'data'    => new KhuVucBaiResource($khuvucbai->fresh()),
        ]);
    }

    // ─── PRIVATE: Tạo ô bãi tự động ──────────────────────────────
    private function taoOBaiTuDong(KhuVucBai $khuvucbai): void
    {
        $obaiData = [];
        for ($k = 1; $k <= $khuvucbai->sokhoang; $k++) {
            for ($h = 1; $h <= $khuvucbai->sohang; $h++) {
                for ($t = 1; $t <= $khuvucbai->sotang; $t++) {
                    $obaiData[] = [
                        'makhuvuc'   => $khuvucbai->makhuvuc,
                        'khoang'     => $k,
                        'hang'       => $h,
                        'tang'       => $t,
                        'maobai_code' => sprintf('%s%02d-%02d-%d', $khuvucbai->tenblock, $k, $h, $t),
                        'trangthai'  => 'trong',
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }
        OBai::insert($obaiData);
    }

    // ─── PRIVATE: Tạo thêm ô bãi khi kích thước tăng ─────────────
    private function taoOBaiBoSung(KhuVucBai $khuvucbai): void
    {
        for ($k = 1; $k <= $khuvucbai->sokhoang; $k++) {
            for ($h = 1; $h <= $khuvucbai->sohang; $h++) {
                for ($t = 1; $t <= $khuvucbai->sotang; $t++) {
                    $maCode = sprintf('%s%02d-%02d-%d', $khuvucbai->tenblock, $k, $h, $t);
                    OBai::firstOrCreate(
                        ['maobai_code' => $maCode],
                        [
                            'makhuvuc'  => $khuvucbai->makhuvuc,
                            'khoang'    => $k,
                            'hang'      => $h,
                            'tang'      => $t,
                            'trangthai' => 'trong',
                        ]
                    );
                }
            }
        }
    }
}