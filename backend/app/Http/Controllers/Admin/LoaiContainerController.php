<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoaiContainer\LuuLoaiContainerRequest;
use App\Http\Requests\LoaiContainer\XoaLoaiContainerRequest;
use App\Http\Resources\LoaiContainerResource;
use App\Models\LogXoa;
use App\Models\LoaiContainer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LoaiContainerController extends Controller
{
    // ─── GET /api/admin/loai-container ───────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = LoaiContainer::query();

        // Lọc theo trạng thái
        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->where('trangthai', 'hoatdong');
        }

        // Tìm kiếm
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('maiso', 'like', "%{$request->search}%")
                  ->orWhere('tenloai', 'like', "%{$request->search}%");
            });
        }

        // Lọc theo loại lạnh
        if ($request->has('lalanh')) {
            $query->where('lalanh', $request->boolean('lalanh'));
        }

        $data = $query->orderBy('maiso')->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => LoaiContainerResource::collection($data->items()),
            'meta' => [
                'tong'         => $data->total(),
                'trang_hien'   => $data->currentPage(),
                'tong_trang'   => $data->lastPage(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/admin/loai-container/{loaicontainer} ───────────
    public function show(LoaiContainer $loaicontainer): JsonResponse
    {
        return response()->json([
            'data' => new LoaiContainerResource($loaicontainer),
        ]);
    }

    // ─── POST /api/admin/loai-container ──────────────────────────
    public function store(LuuLoaiContainer $request): JsonResponse
    {
        $loai = LoaiContainer::create([
            ...$request->validated(),
            'trangthai' => 'hoatdong',
        ]);

        return response()->json([
            'message' => 'Thêm loại container thành công.',
            'data'    => new LoaiContainerResource($loai),
        ], 201);
    }

    // ─── PUT /api/admin/loai-container/{loaicontainer} ───────────
    public function update(LuuLoaiContainer $request, LoaiContainer $loaicontainer): JsonResponse
    {
        if ($loaicontainer->trangthai === 'khonghoatdong') {
            return response()->json([
                'message' => 'Không thể sửa loại container đã bị vô hiệu hóa.',
            ], 422);
        }

        $loaicontainer->update($request->validated());

        return response()->json([
            'message' => 'Cập nhật loại container thành công.',
            'data'    => new LoaiContainerResource($loaicontainer->fresh()),
        ]);
    }

    // ─── DELETE /api/admin/loai-container/{loaicontainer} ────────
    // Soft delete — yêu cầu lý do + chuỗi xác nhận "Delete <maiso>"
    public function destroy(XoaLoaiContainer $request, LoaiContainer $loaicontainer): JsonResponse
    {
        // Kiểm tra đang được sử dụng
        if ($loaicontainer->dangDuocSuDung()) {
            $soLuong = $loaicontainer->containers()->count();
            return response()->json([
                'message' => "Không thể xóa. Loại container này đang có {$soLuong} container đang sử dụng.",
            ], 422);
        }

        // Kiểm tra chuỗi xác nhận
        $chuoiDungThan = "Delete {$loaicontainer->maiso}";
        if ($request->xacnhan_xoa !== $chuoiDungThan) {
            return response()->json([
                'message' => "Chuỗi xác nhận không đúng. Vui lòng gõ: \"{$chuoiDungThan}\"",
            ], 422);
        }

        // Ghi log xóa
        LogXoa::create([
            'loaidoituong'  => 'loaicontainer',
            'madoituong'    => $loaicontainer->maloai,
            'tendoituong'   => "{$loaicontainer->maiso} — {$loaicontainer->tenloai}",
            'nguoixoa'      => $request->user()->mataikhoan,
            'lydo_xoa'      => $request->lydo_xoa,
            'chuoixacnhan'  => $request->xacnhan_xoa,
            'thoigian_xoa'  => now(),
        ]);

        // Soft delete — chuyển trạng thái
        $loaicontainer->update(['trangthai' => 'khonghoatdong']);

        return response()->json([
            'message' => "Loại container {$loaicontainer->maiso} đã được vô hiệu hóa thành công.",
        ]);
    }

    // ─── PATCH /api/admin/loai-container/{loaicontainer}/khoiphuc ─
    // Khôi phục loại container đã bị vô hiệu hóa (chỉ Admin)
    public function khoiPhuc(LoaiContainer $loaicontainer): JsonResponse
    {
        if ($loaicontainer->trangthai === 'hoatdong') {
            return response()->json(['message' => 'Loại container này đang hoạt động.'], 422);
        }

        $loaicontainer->update(['trangthai' => 'hoatdong']);

        return response()->json([
            'message' => "Đã khôi phục loại container {$loaicontainer->maiso}.",
            'data'    => new LoaiContainerResource($loaicontainer->fresh()),
        ]);
    }
}