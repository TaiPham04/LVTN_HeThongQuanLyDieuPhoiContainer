<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\BienBanKTD\LuuBienBan;
use App\Http\Resources\BienBanKTDResource;
use App\Models\BienBanKTD;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BienBanKTDController extends Controller
{
    // ─── GET /api/admin/bien-ban-ktd ──────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = BienBanKTD::with(['container.hangtau', 'nhanvien']);

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
            'data' => BienBanKTDResource::collection($data->items()),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'total'        => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── POST /api/admin/bien-ban-ktd ─────────────────────────────
    public function store(LuuBienBan $request): JsonResponse
    {
        $container = Container::where('socontainer', $request->socontainer)->first();

        $bienban = BienBanKTD::create([
            'macontainer'  => $container->macontainer,
            'manhanvien'   => $request->user()->mataikhoan,
            'loaiktd'      => $request->loaiktd,
            'ketqua_ktd'   => $request->ketqua_ktd,
            'bi_hong'      => $request->bi_hong,
            'ketluan'      => $request->ketluan,
            'thoigian_ktd' => $request->thoigian_ktd,
        ]);

        $containerUpdate = [];

        // Đồng bộ trạng thái hư hỏng
        if ($request->bi_hong) {
            $containerUpdate['bi_hong'] = true;
        }

        // Biên bản hải quan → cập nhật trangthai_haiquan
        if ($request->loaiktd === 'haiquan') {
            $containerUpdate['trangthai_haiquan'] = match ($request->ketluan) {
                'datieu'   => 'dathongguan',
                'tamgiu'   => 'biugiu',
                'khongdat' => 'biugiu',
                default    => $container->trangthai_haiquan,
            };
        }

        if (!empty($containerUpdate)) {
            $container->update($containerUpdate);
        }

        return response()->json([
            'message' => "Đã lập biên bản kiểm tra container {$container->socontainer}.",
            'data'    => new BienBanKTDResource($bienban->load(['container.hangtau', 'nhanvien'])),
        ], 201);
    }
}
