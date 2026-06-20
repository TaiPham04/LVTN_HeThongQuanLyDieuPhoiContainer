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
        $query = Container::with(['loaicontainer', 'hangtau', 'chuyentau']);

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

    // ─── GET /api/nv/cong/container/{container} ──────────────────
    public function show(Container $container): JsonResponse
    {
        return response()->json([
            'data' => new ContainerResource($container->load(['loaicontainer', 'hangtau', 'chuyentau'])),
        ]);
    }

    // ─── POST /api/nv/cong/container ─────────────────────────────
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
}
