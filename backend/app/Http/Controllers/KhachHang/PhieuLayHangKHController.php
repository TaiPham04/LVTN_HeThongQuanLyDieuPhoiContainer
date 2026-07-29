<?php

namespace App\Http\Controllers\KhachHang;

use App\Http\Controllers\Controller;
use App\Http\Resources\PhieuLayHangResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\PhieuLayHang;
use App\Models\TaiXe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PhieuLayHangKHController extends Controller
{
    // GET /api/kh/phieu-lay-hang
    public function index(Request $request): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        // Tự động đánh dấu hết hạn
        PhieuLayHang::whereHas('container', fn ($q) => $q->where('makhachhang', $makh))
            ->where('trangthai', 'cho_lay')
            ->where('thoigian_het_han', '<', now())
            ->update(['trangthai' => 'het_han']);

        $query = PhieuLayHang::with(['container.chuyentau.hangtau', 'taixe'])
            ->whereHas('container', fn ($q) => $q->where('makhachhang', $makh));

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        }

        if ($request->search) {
            $query->whereHas('container', fn ($q) =>
                $q->where('socontainer', 'like', "%{$request->search}%")
            );
        }

        $data = $query->orderByDesc('thoigian_xuat')
            ->paginate($request->get('per_page', 10), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => PhieuLayHangResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'   => $data->perPage(),
            ],
        ]);
    }

    // POST /api/kh/phieu-lay-hang
    public function store(Request $request): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        $request->validate([
            'macontainer' => 'required|integer|exists:container,macontainer',
            'mataixe'     => 'nullable|integer|exists:taixe,mataixe',
            'biensoxe'    => 'nullable|string|max:20',
            'bienso_romo' => 'nullable|string|max:20',
            'eta_tu'      => 'nullable|date',
            'eta_den'     => 'nullable|date',
            'ghichu'      => 'nullable|string|max:500',
        ]);

        $container = Container::findOrFail($request->macontainer);

        if ($container->makhachhang !== $makh) {
            return response()->json(['message' => 'Container này không thuộc về bạn.'], 403);
        }

        if ($container->trangthai !== 'trongbai') {
            return response()->json(['message' => 'Container không đang trong bãi, không thể tạo phiếu lấy hàng.'], 422);
        }

        if (!$container->da_thong_quan) {
            return response()->json(['message' => 'Container chưa được thông quan. Vui lòng hoàn tất thủ tục hải quan trước.'], 422);
        }

        // Nếu chọn tài xế, kiểm tra thuộc về KH này
        if ($request->mataixe) {
            $taixe = TaiXe::find($request->mataixe);
            if (!$taixe || $taixe->makhachhang !== $makh) {
                return response()->json(['message' => 'Tài xế không thuộc về công ty của bạn.'], 422);
            }
        }

        // Kiểm tra phiếu còn hiệu lực
        $phieuConHieuLuc = PhieuLayHang::where('macontainer', $container->macontainer)
            ->where('trangthai', 'cho_lay')
            ->where('thoigian_het_han', '>', now())
            ->first();

        if ($phieuConHieuLuc) {
            return response()->json([
                'message' => "Container đã có phiếu lấy hàng còn hiệu lực (hết hạn lúc {$phieuConHieuLuc->thoigian_het_han->format('H:i d/m/Y')}).",
            ], 422);
        }

        // Lấy vị trí hiện tại
        $lichsu = LichSuViTri::with(['obai.khuvucbai'])
            ->where('macontainer', $container->macontainer)
            ->whereNull('thoigian_roi')
            ->latest('thoigian_gan')
            ->first();

        $vitriSnapshot = $lichsu ? [
            'maobai'      => $lichsu->obai->maobai ?? null,
            'maobai_code' => $lichsu->obai->maobai_code ?? null,
            'tenblock'    => $lichsu->obai->khuvucbai?->tenblock,
            'khoang'      => $lichsu->obai->khoang ?? null,
            'hang'        => $lichsu->obai->hang ?? null,
            'tang'        => $lichsu->obai->tang ?? null,
        ] : null;

        $now = now();
        $phieu = PhieuLayHang::create([
            'macontainer'      => $container->macontainer,
            'manhanvien'       => null,
            'mataixe'          => $request->mataixe,
            'biensoxe'         => $request->biensoxe,
            'bienso_romo'      => $request->bienso_romo,
            'vitri_snapshot'   => $vitriSnapshot,
            'ma_qr'            => Str::upper(Str::random(8)) . '-' . Str::upper(Str::random(8)) . '-' . Str::upper(Str::random(8)),
            'trangthai'        => 'cho_lay',
            'thoigian_xuat'    => $now,
            'thoigian_het_han' => $now->copy()->addHours(24),
            'eta_tu'           => $request->eta_tu,
            'eta_den'          => $request->eta_den,
            'ghichu'           => $request->ghichu,
        ]);

        return response()->json([
            'message' => "Tạo phiếu lấy hàng thành công. Vui lòng đến cổng trong 24 giờ.",
            'data'    => new PhieuLayHangResource($phieu->load(['container.chuyentau.hangtau', 'taixe'])),
        ], 201);
    }

    // GET /api/kh/phieu-lay-hang/{phieu}
    public function show(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        if ($phieu->container?->makhachhang !== $makh) {
            return response()->json(['message' => 'Không có quyền truy cập.'], 403);
        }

        if ($phieu->trangthai === 'cho_lay' && $phieu->thoigian_het_han < now()) {
            $phieu->update(['trangthai' => 'het_han']);
            $phieu->refresh();
        }

        return response()->json([
            'data' => new PhieuLayHangResource($phieu->load(['container.chuyentau.hangtau', 'taixe', 'nhanvien'])),
        ]);
    }

    // PATCH /api/kh/phieu-lay-hang/{phieu}/huy
    public function huy(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        if ($phieu->container?->makhachhang !== $makh) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        if ($phieu->trangthai !== 'cho_lay') {
            return response()->json(['message' => 'Chỉ có thể hủy phiếu đang chờ lấy hàng.'], 422);
        }

        $phieu->update(['trangthai' => 'huy']);

        return response()->json(['message' => 'Đã hủy phiếu lấy hàng.']);
    }

    // GET /api/kh/container-trong-bai  — danh sách container có thể tạo phiếu
    public function containerTrongBai(Request $request): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        $data = Container::with(['loaicontainer'])
            ->where('makhachhang', $makh)
            ->where('trangthai', 'trongbai')
            ->where('da_thong_quan', true)
            ->whereDoesntHave('phieulayhangs', fn ($q) =>
                $q->where('trangthai', 'cho_lay')->where('thoigian_het_han', '>', now())
            )
            ->get()
            ->map(fn ($c) => [
                'macontainer' => $c->macontainer,
                'socontainer' => $c->socontainer,
                'tenloai'     => $c->loaicontainer->tenloai ?? null,
            ]);

        return response()->json(['data' => $data]);
    }
}
