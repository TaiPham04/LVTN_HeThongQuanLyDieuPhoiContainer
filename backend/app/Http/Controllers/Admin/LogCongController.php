<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LogCong\GhiNhanXuatNhap;
use App\Http\Resources\LogCongResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\LogCong;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LogCongController extends Controller
{
    // ─── GET /api/admin/cong ──────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = LogCong::with(['container.hangtau', 'chuyentau', 'taixe', 'nhanvien']);

        if ($request->kieu_xuatnhap) {
            $query->where('kieu_xuatnhap', $request->kieu_xuatnhap);
        }

        if ($request->search) {
            $query->whereHas('container', function ($q) use ($request) {
                $q->where('socontainer', 'like', "%{$request->search}%");
            });
        }

        if ($request->ngay) {
            $query->whereDate('thoigian_xl', $request->ngay);
        }

        $data = $query->orderBy('thoigian_xl', 'desc')
                      ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => LogCongResource::collection($data->items()),
            'meta' => [
                'current_page' => $data->currentPage(),
                'last_page'    => $data->lastPage(),
                'total'        => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── POST /api/admin/cong ─────────────────────────────────────
    public function store(GhiNhanXuatNhap $request): JsonResponse
    {
        $container = Container::where('socontainer', $request->socontainer)->first();

        if ($request->kieu_xuatnhap === 'nhap') {
            if ($container->trangthai === 'trongbai') {
                return response()->json([
                    'message' => "Container {$container->socontainer} đang ở trong bãi.",
                ], 422);
            }
            if ($container->trangthai === 'khonghoatdong') {
                return response()->json([
                    'message' => "Container {$container->socontainer} đã bị vô hiệu hóa.",
                ], 422);
            }
        } else {
            if ($container->trangthai !== 'trongbai') {
                return response()->json([
                    'message' => "Container {$container->socontainer} không đang trong bãi (trạng thái: {$container->trangthai}).",
                ], 422);
            }
        }

        $log = LogCong::create([
            'macontainer'   => $container->macontainer,
            'machuyentau'   => $request->machuyentau,
            'mataixe'       => $request->mataixe,
            'manhanvien'    => $request->user()->mataikhoan,
            'kieu_xuatnhap' => $request->kieu_xuatnhap,
            'biensoxe'      => $request->biensoxe,
            'niemchi_ktra'  => $request->niemchi_ktra,
            'niemchi_ok'    => $request->niemchi_ok,
            // Snapshot trạng thái hải quan tại thời điểm qua cổng (không dùng để cập nhật container)
            'haiquan_ok'    => $container->trangthai_haiquan === 'dathongguan',
            'ghichu'        => $request->ghichu,
            'thoigian_xl'   => now(),
        ]);

        if ($request->kieu_xuatnhap === 'nhap') {
            $container->update(['trangthai' => 'trongbai']);
        } else {
            $container->update(['trangthai' => 'xuatcong']);
            LichSuViTri::where('macontainer', $container->macontainer)
                ->whereNull('thoigian_roi')
                ->update(['thoigian_roi' => now()]);
        }

        $label = $request->kieu_xuatnhap === 'nhap' ? 'nhập bãi' : 'xuất bãi';

        return response()->json([
            'message' => "Ghi nhận {$label} container {$container->socontainer} thành công.",
            'data'    => new LogCongResource($log->load(['container.hangtau', 'chuyentau', 'taixe', 'nhanvien'])),
        ], 201);
    }
}
