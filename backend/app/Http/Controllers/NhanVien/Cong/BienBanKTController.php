<?php

namespace App\Http\Controllers\NhanVien\Cong;

use App\Http\Controllers\Controller;
use App\Http\Requests\BienBanKT\LuuBienBan;
use App\Http\Resources\BienBanKTResource;
use App\Models\BienBanKT;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BienBanKTController extends Controller
{
    // ─── GET /api/nv/cong/bien-ban-kt ────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = BienBanKT::with(['container.chuyentau.hangtau', 'nhanvien']);

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
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => BienBanKTResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── POST /api/nv/cong/bien-ban-kt ───────────────────────────
    public function store(LuuBienBan $request): JsonResponse
    {
        $container = Container::where('socontainer', $request->socontainer)->first();

        // L10: Không lập biên bản hải quan cho container đã rời bãi
        if ($request->loaiktd === 'haiquan' && in_array($container->trangthai, ['xuatcong', 'dalenken'])) {
            $label = $container->trangthai === 'dalenken' ? 'đã lên tàu' : 'đã xuất khỏi cảng';
            return response()->json([
                'message' => "Container {$container->socontainer} {$label}. Không thể lập biên bản kiểm tra hải quan.",
            ], 422);
        }

        $bienban = BienBanKT::create([
            'macontainer'  => $container->macontainer,
            'manhanvien'   => $request->user()->mataikhoan,
            'loaiktd'      => $request->loaiktd,
            'chu_ky'       => $request->chu_ky,
            'ketqua_ktd'   => $request->ketqua_ktd,
            'bi_hong'      => $request->bi_hong,
            'ketluan'      => $request->ketluan,
            'thoigian_ktd' => $request->thoigian_ktd,
        ]);

        $containerUpdate = [];

        if ($request->bi_hong) {
            $containerUpdate['bi_hong'] = true;
        }

        // Kiểm hóa chỉ thay đổi trạng thái THÔNG QUAN, không đổi luồng đã phân —
        // luồng (xanh/vàng/đỏ) là nhãn cố định gắn với tờ khai từ đầu.
        if ($request->loaiktd === 'haiquan') {
            $containerUpdate['da_thong_quan'] = $request->ketluan === 'datieu';
        }

        if (!empty($containerUpdate)) {
            $container->update($containerUpdate);
        }

        return response()->json([
            'message' => "Đã lập biên bản kiểm tra container {$container->socontainer}.",
            'data'    => new BienBanKTResource($bienban->load(['container.chuyentau.hangtau', 'nhanvien'])),
        ], 201);
    }
}
