<?php

namespace App\Http\Controllers\NhanVien\Bai;

use App\Http\Controllers\Controller;
use App\Http\Resources\BienBanKTResource;
use App\Models\BienBanKT;
use App\Models\Container;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BienBanKTController extends Controller
{
    // GET /api/nv/bai/bien-ban-kt
    public function index(Request $request): JsonResponse
    {
        $query = BienBanKT::with(['container.chuyentau.hangtau', 'nhanvien'])
            ->where('loaiktd', 'dinhky');

        if ($request->ketluan) {
            $query->where('ketluan', $request->ketluan);
        }

        if ($request->chu_ky) {
            $query->where('chu_ky', $request->chu_ky);
        }

        if ($request->search) {
            $query->whereHas('container', fn ($q) =>
                $q->where('socontainer', 'like', "%{$request->search}%")
            );
        }

        $data = $query->orderBy('thoigian_ktd', 'desc')
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => BienBanKTResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // POST /api/nv/bai/bien-ban-kt
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'socontainer'  => 'required|string|exists:container,socontainer',
            'chu_ky'       => 'required|in:hang_thang,hang_quy,hang_nam',
            'ketqua_ktd'   => 'required|string|max:2000',
            'bi_hong'      => 'required|boolean',
            'ketluan'      => 'required|in:datieu,khongdat,tamgiu',
            'thoigian_ktd' => 'required|date',
        ], [
            'socontainer.exists' => 'Không tìm thấy container này trong hệ thống.',
            'chu_ky.required'    => 'Chu kỳ kiểm tra là bắt buộc.',
            'ketqua_ktd.required' => 'Kết quả kiểm tra là bắt buộc.',
        ]);

        $container = Container::where('socontainer', strtoupper(trim($request->socontainer)))->first();

        $bienban = DB::transaction(function () use ($request, $container) {
            $bienban = BienBanKT::create([
                'macontainer'  => $container->macontainer,
                'manhanvien'   => $request->user()->mataikhoan,
                'loaiktd'      => 'dinhky',
                'chu_ky'       => $request->chu_ky,
                'ketqua_ktd'   => $request->ketqua_ktd,
                'bi_hong'      => $request->bi_hong,
                'ketluan'      => $request->ketluan,
                'thoigian_ktd' => $request->thoigian_ktd,
            ]);

            if ($request->bi_hong) {
                $container->update(['bi_hong' => true]);
            }

            return $bienban;
        });

        return response()->json([
            'message' => "Đã lập biên bản kiểm tra định kỳ container {$container->socontainer}.",
            'data'    => new BienBanKTResource($bienban->load(['container.chuyentau.hangtau', 'nhanvien'])),
        ], 201);
    }
}
