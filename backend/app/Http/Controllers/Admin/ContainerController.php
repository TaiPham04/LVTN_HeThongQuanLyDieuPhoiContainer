<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Container\LuuContainer;
use App\Http\Requests\Container\XoaContainer;
use App\Http\Resources\ContainerResource;
use App\Models\Container;
use App\Models\LogXoa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerController extends Controller
{
    // ─── GET /api/admin/container/lookup?socontainer=XXXX ────────
    public function lookup(Request $request): JsonResponse
    {
        if (!$request->socontainer) {
            return response()->json(['data' => null]);
        }

        $container = Container::where('socontainer', strtoupper($request->socontainer))->first();

        if (!$container) {
            return response()->json(['data' => null]);
        }

        return response()->json([
            'data' => [
                'macontainer'       => $container->macontainer,
                'socontainer'       => $container->socontainer,
                'soniemchi'         => $container->soniemchi,
                'trangthai'         => $container->trangthai,
                'trangthai_haiquan' => $container->trangthai_haiquan,
            ],
        ]);
    }

    // ─── GET /api/admin/container ─────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Container::with(['loaicontainer', 'hangtau', 'chuyentau']);

        // Mặc định ẩn khonghoatdong
        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->where('trangthai', '!=', 'khonghoatdong');
        }

        if ($request->mahangtau) {
            $query->where('mahangtau', $request->mahangtau);
        }

        if ($request->maloai) {
            $query->where('maloai', $request->maloai);
        }

        if ($request->search) {
            $query->where('socontainer', 'like', "%{$request->search}%");
        }

        $data = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => ContainerResource::collection($data->items()),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'total'        => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/admin/container/{container} ─────────────────────
    public function show(Container $container): JsonResponse
    {
        return response()->json([
            'data' => new ContainerResource($container->load(['loaicontainer', 'hangtau', 'chuyentau'])),
        ]);
    }

    // ─── POST /api/admin/container ────────────────────────────────
    public function store(LuuContainer $request): JsonResponse
    {
        $container = Container::create([
            ...$request->validated(),
            'trangthai'         => 'dangky',
            'trangthai_haiquan' => 'luong_vang',
        ]);

        return response()->json([
            'message' => "Đã đăng ký container {$container->socontainer} thành công.",
            'data'    => new ContainerResource($container->load(['loaicontainer', 'hangtau', 'chuyentau'])),
        ], 201);
    }

    // ─── PUT /api/admin/container/{container} ─────────────────────
    public function update(LuuContainer $request, Container $container): JsonResponse
    {
        if ($container->trangthai === 'khonghoatdong') {
            return response()->json([
                'message' => 'Không thể sửa container đã bị vô hiệu hóa.',
            ], 422);
        }

        if ($container->dangTrongBai()) {
            return response()->json([
                'message' => 'Container đang trong bãi, chỉ có thể sửa thông tin phụ.',
            ], 422);
        }

        $container->update($request->validated());

        return response()->json([
            'message' => "Cập nhật container {$container->socontainer} thành công.",
            'data'    => new ContainerResource($container->fresh()->load(['loaicontainer', 'hangtau', 'chuyentau'])),
        ]);
    }

    // ─── DELETE /api/admin/container/{container} ──────────────────
    public function destroy(XoaContainer $request, Container $container): JsonResponse
    {
        if ($container->dangTrongBai()) {
            return response()->json([
                'message' => "Không thể xóa. Container {$container->socontainer} đang trong bãi.",
            ], 422);
        }

        if ($container->trangthai === 'khonghoatdong') {
            return response()->json(['message' => 'Container này đã bị vô hiệu hóa trước đó.'], 422);
        }

        $chuoiDungThan = "Delete {$container->socontainer}";
        if ($request->xacnhan_xoa !== $chuoiDungThan) {
            return response()->json([
                'message' => "Chuỗi xác nhận không đúng. Vui lòng gõ: \"{$chuoiDungThan}\"",
            ], 422);
        }

        LogXoa::create([
            'loaidoituong' => 'container',
            'madoituong'   => $container->macontainer,
            'tendoituong'  => $container->socontainer,
            'nguoixoa'     => $request->user()->mataikhoan,
            'lydo_xoa'     => $request->lydo_xoa,
            'chuoixacnhan' => $request->xacnhan_xoa,
            'thoigian_xoa' => now(),
        ]);

        $container->update(['trangthai' => 'khonghoatdong']);

        return response()->json([
            'message' => "Container {$container->socontainer} đã được vô hiệu hóa thành công.",
        ]);
    }
}
