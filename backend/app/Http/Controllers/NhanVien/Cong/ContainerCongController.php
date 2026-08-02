<?php

namespace App\Http\Controllers\NhanVien\Cong;

use App\Http\Controllers\Controller;
use App\Http\Requests\Container\LuuContainer;
use App\Http\Resources\ContainerResource;
use App\Models\Container;
use App\Models\LogCong;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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
                'da_thong_quan'     => (bool) $container->da_thong_quan,
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

    // ─── POST /api/nv/cong/container ─────────────────────────────
    // Đăng ký container mới = xe đã có mặt tại cổng, nên ghi nhận nhập cổng luôn
    public function store(LuuContainer $request): JsonResponse
    {
        $container = DB::transaction(function () use ($request) {
            $now = now();

            $container = Container::create([
                ...$request->validated(),
                ...Container::phanLuongNgauNhien(),
                'trangthai'         => 'trongbai',
                'thoigian_vaobai'   => $now,
            ]);

            LogCong::create([
                'macontainer'   => $container->macontainer,
                'machuyentau'   => $container->machuyentau,
                'manhanvien'    => $request->user()->mataikhoan,
                'kieu_xuatnhap' => 'nhap',
                'ghichu'        => 'Nhập cổng theo đăng ký container.',
                'thoigian_xl'   => $now,
            ]);

            return $container;
        });

        return response()->json([
            'message' => "Đã đăng ký và ghi nhận nhập cổng container {$container->socontainer} thành công.",
            'data'    => new ContainerResource($container->load(['loaicontainer', 'chuyentau.hangtau'])),
        ], 201);
    }
}
