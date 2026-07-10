<?php

namespace App\Http\Controllers\NhanVien\Cong;

use App\Http\Controllers\Controller;
use App\Http\Requests\Container\LuuContainer;
use App\Http\Resources\ContainerResource;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerCongController extends Controller
{
    // ─── GET /api/nv/cong/container/lookup ───────────────────────
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

    // ─── GET /api/nv/cong/container ──────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Container::with(['loaicontainer', 'chuyentau.hangtau']);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->where('trangthai', '!=', 'khonghoatdong');
        }

        if ($request->mahangtau) {
            $query->whereHas('chuyentau', fn ($q) => $q->where('mahangtau', $request->mahangtau));
        }

        if ($request->maloai) {
            $query->where('maloai', $request->maloai);
        }

        if ($request->search) {
            $query->where('socontainer', 'like', "%{$request->search}%");
        }

        $data = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => ContainerResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── GET /api/nv/cong/container/{container} ──────────────────
    public function show(Container $container): JsonResponse
    {
        return response()->json([
            'data' => new ContainerResource($container->load(['loaicontainer', 'chuyentau.hangtau'])),
        ]);
    }

    // ─── PATCH /api/nv/cong/container/{container}/hai-quan ───────
    public function capNhatHaiQuan(Request $request, Container $container): JsonResponse
    {
        $request->validate([
            'trangthai_haiquan' => 'required|in:luong_xanh,luong_vang,luong_do',
            'ghichu_haiquan'    => 'nullable|string|max:500',
        ]);

        $labelMap = ['luong_xanh' => 'Luồng xanh', 'luong_vang' => 'Luồng vàng', 'luong_do' => 'Luồng đỏ'];
        $cu  = $container->trangthai_haiquan;
        $moi = $request->trangthai_haiquan;

        if (in_array($container->trangthai, ['dalenken', 'xuatcong']) && $moi !== 'luong_xanh') {
            $trangthaiLabel = $container->trangthai === 'dalenken' ? 'đã lên tàu' : 'đã xuất cổng';
            return response()->json([
                'message' => "Container {$container->socontainer} {$trangthaiLabel}. Chỉ có thể cập nhật thành Luồng xanh (để hiệu chỉnh hồ sơ).",
            ], 422);
        }

        $container->update(['trangthai_haiquan' => $moi]);

        return response()->json([
            'message' => "Cập nhật hải quan {$container->socontainer}: {$labelMap[$cu]} → {$labelMap[$moi]}.",
            'data'    => new ContainerResource($container->fresh()->load(['loaicontainer', 'chuyentau.hangtau'])),
        ]);
    }

    // ─── POST /api/nv/cong/container ─────────────────────────────
    public function store(LuuContainer $request): JsonResponse
    {
        $container = Container::create([
            ...$request->validated(),
            'trangthai'         => 'dangky',
            'trangthai_haiquan' => 'chua_khai',
        ]);

        return response()->json([
            'message' => "Đã đăng ký container {$container->socontainer} thành công.",
            'data'    => new ContainerResource($container->load(['loaicontainer', 'chuyentau.hangtau'])),
        ], 201);
    }
}
