<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BienBanKT\LuuBienBan;
use App\Http\Resources\BienBanKTResource;
use App\Models\BienBanKT;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BienBanKTController extends Controller
{
    // ─── GET /api/admin/bien-ban-kt ───────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = BienBanKT::with(['container.hangtau', 'nhanvien']);

        if ($request->loaiktd) {
            $query->where('loaiktd', $request->loaiktd);
        }

        if ($request->ketluan) {
            $query->where('ketluan', $request->ketluan);
        }

        if ($request->search) {
            $query->whereHas('container', function ($q) use ($request) {
                $q->where('socontainer', 'like', "%{$request->search}%");
            });
        }

        $data = $query->orderBy('thoigian_ktd', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => BienBanKTResource::collection($data->items()),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'total'        => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── POST /api/admin/bien-ban-kt ──────────────────────────────
    public function store(LuuBienBan $request): JsonResponse
    {
        $container = Container::where('socontainer', $request->socontainer)->first();

        $bienban = BienBanKT::create([
            'macontainer'  => $container->macontainer,
            'manhanvien'   => $request->user()->mataikhoan,
            'loaiktd'      => $request->loaiktd,
            'ketqua_ktd'   => $request->ketqua_ktd,
            'bi_hong'      => $request->bi_hong,
            'ketluan'      => $request->ketluan,
            'thoigian_ktd' => $request->thoigian_ktd,
        ]);

        $containerUpdate = [];

        if ($request->bi_hong) {
            $containerUpdate['bi_hong'] = true;
        }

        if ($request->loaiktd === 'haiquan') {
            $containerUpdate['trangthai_haiquan'] = match ($request->ketluan) {
                'datieu'   => 'luong_xanh',
                'tamgiu'   => 'luong_do',
                'khongdat' => 'luong_do',
                default    => $container->trangthai_haiquan,
            };
        }

        if (!empty($containerUpdate)) {
            $container->update($containerUpdate);
        }

        return response()->json([
            'message' => "Đã lập biên bản kiểm tra container {$container->socontainer}.",
            'data'    => new BienBanKTResource($bienban->load(['container.hangtau', 'nhanvien'])),
        ], 201);
    }
}
