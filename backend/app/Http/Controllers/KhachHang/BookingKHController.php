<?php

namespace App\Http\Controllers\KhachHang;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContainerResource;
use App\Models\ChuyenTau;
use App\Models\Container;
use App\Models\HangTau;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BookingKHController extends Controller
{
    // GET /api/kh/booking  — danh sách container đã đăng ký
    public function index(Request $request): JsonResponse
    {
        $makh  = $request->user()->mataikhoan;
        $query = Container::with(['loaicontainer', 'chuyentau.hangtau'])
            ->where('makhachhang', $makh);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        }

        if ($request->search) {
            $query->where('socontainer', 'like', "%{$request->search}%");
        }

        $data = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 10), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => ContainerResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // POST /api/kh/booking  — đăng ký container mới (E-Booking)
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'socontainer'   => 'required|string|min:11|max:11',
            'maloai'        => 'required|integer|exists:loaicontainer,maloai',
            'machuyentau'   => 'required|integer|exists:chuyentau,machuyentau',
            'soniemchi'     => 'nullable|string|max:50',
            'trongluong_kg' => 'nullable|numeric|min:0',
            'mota_hanghoa'  => 'nullable|string|max:500',
            'ghichu'        => 'nullable|string|max:500',
        ]);

        $socontainer = strtoupper(trim($request->socontainer));

        // Kiểm tra số container chưa tồn tại
        if (Container::where('socontainer', $socontainer)->exists()) {
            return response()->json(['message' => "Số container {$socontainer} đã tồn tại trong hệ thống."], 422);
        }

        // Kiểm tra chuyến tàu chỉ cho phép đăng ký khi còn dalenlich
        $chuyentau = ChuyenTau::findOrFail($request->machuyentau);
        if (!in_array($chuyentau->trangthai, ['dalenlich', 'dadencang'])) {
            return response()->json(['message' => 'Chuyến tàu này không còn nhận đăng ký.'], 422);
        }

        $container = Container::create([
            'socontainer'       => $socontainer,
            'loai_hinh'         => 'xuat',
            'maloai'            => $request->maloai,
            'machuyentau'       => $request->machuyentau,
            'makhachhang'       => $request->user()->mataikhoan,
            'soniemchi'         => $request->soniemchi,
            'trongluong_kg'     => $request->trongluong_kg,
            'mota_hanghoa'      => $request->mota_hanghoa,
            'ghichu'            => $request->ghichu,
            'trangthai'         => 'dangky',
            'trangthai_haiquan' => 'chua_khai',
        ]);

        return response()->json([
            'message' => "Đăng ký container {$socontainer} thành công. Chờ xác nhận từ cảng.",
            'data'    => new ContainerResource($container->load(['loaicontainer', 'chuyentau.hangtau'])),
        ], 201);
    }

    // PATCH /api/kh/booking/{container}/huy  — hủy đăng ký
    public function huy(Request $request, Container $container): JsonResponse
    {
        if ($container->makhachhang !== $request->user()->mataikhoan) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        if ($container->trangthai !== 'dangky') {
            return response()->json(['message' => 'Chỉ có thể hủy container ở trạng thái đăng ký.'], 422);
        }

        // Không cho hủy nếu tàu đã đến cảng
        $chuyentau = $container->chuyentau;
        if ($chuyentau && in_array($chuyentau->trangthai, ['dadencang', 'daroi'])) {
            return response()->json(['message' => 'Không thể hủy — chuyến tàu đã cập cảng hoặc đã rời.'], 422);
        }

        $container->delete();

        return response()->json(['message' => "Đã hủy đăng ký container {$container->socontainer}."]);
    }

    // GET /api/kh/lich-tau  — danh sách chuyến tàu sắp đến (cho form booking)
    public function lichTau(): JsonResponse
    {
        $data = ChuyenTau::with('hangtau')
            ->whereIn('trangthai', ['dalenlich', 'dadencang'])
            ->orderBy('thoigiandukien')
            ->get()
            ->map(fn ($ct) => [
                'machuyentau'    => $ct->machuyentau,
                'sovoyage'       => $ct->sovoyage,
                'tentau'         => $ct->tentau,
                'mascac'         => $ct->hangtau->mascac ?? null,
                'thoigiandukien' => $ct->thoigiandukien?->format('d/m/Y H:i'),
                'trangthai'      => $ct->trangthai,
            ]);

        return response()->json(['data' => $data]);
    }
}
