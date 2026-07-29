<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Container\LuuContainer;
use App\Http\Requests\Container\XoaContainer;
use App\Http\Resources\ContainerResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\LogCong;
use App\Models\LogXoa;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ContainerController extends Controller
{
    // ─── GET /api/admin/container/tra-cuu?socontainer=XXXX ──────
    public function traCuu(Request $request): JsonResponse
    {
        $socontainer = strtoupper(trim($request->socontainer ?? ''));

        if (!$socontainer) {
            return response()->json(['message' => 'Vui lòng nhập số container.'], 422);
        }

        $container = Container::where('socontainer', $socontainer)
            ->with(['loaicontainer', 'chuyentau.hangtau'])
            ->first();

        if (!$container) {
            return response()->json(['message' => "Không tìm thấy container {$socontainer}."], 404);
        }

        $lichSu = LichSuViTri::where('macontainer', $container->macontainer)
            ->with(['obai.khuvucbai', 'nhanvien'])
            ->orderBy('thoigian_gan')
            ->get();

        $rows = $lichSu->values()->map(function ($ls, $idx) use ($lichSu) {
            $tuObai = $idx > 0 ? $lichSu[$idx - 1]->obai?->maobai_code : null;
            return [
                'malichsu'       => $ls->malichsu,
                'kieudichchuyen' => $ls->kieudichchuyen,
                'tu_obai'        => $tuObai,
                'den_obai'       => $ls->obai?->maobai_code,
                'tenblock'       => $ls->obai?->khuvucbai?->tenblock,
                'khoang'         => $ls->obai?->khoang,
                'hang'           => $ls->obai?->hang,
                'tang'           => $ls->obai?->tang,
                'hoten_nv'       => $ls->nhanvien?->hoten,
                'thoigian_gan'   => $ls->thoigian_gan?->format('d/m/Y H:i'),
                'thoigian_roi'   => $ls->thoigian_roi?->format('d/m/Y H:i'),
                'la_hien_tai'    => is_null($ls->thoigian_roi),
                'ghichu'         => $ls->ghichu,
            ];
        });

        return response()->json([
            'container' => [
                'socontainer'       => $container->socontainer,
                'tenloai'           => $container->loaicontainer?->tenloai,
                'loai_hinh'         => $container->loai_hinh,
                'trangthai'         => $container->trangthai,
                'trangthai_haiquan' => $container->trangthai_haiquan,
                'da_thong_quan'     => (bool) $container->da_thong_quan,
                'sovoyage'          => $container->chuyentau?->sovoyage,
                'tentau'            => $container->chuyentau?->tentau,
                'mascac'            => $container->chuyentau?->hangtau?->mascac,
                'so_vandon'         => $container->so_vandon,
                'ten_consignee'     => $container->ten_consignee,
                'thoigian_vaobai'   => $container->thoigian_vaobai?->format('d/m/Y H:i'),
                'thoigian_rabai'    => $container->thoigian_rabai?->format('d/m/Y H:i'),
            ],
            'lich_su' => $rows,
        ]);
    }

    // ─── GET /api/admin/container/lookup?socontainer=XXXX ────────
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

    // ─── GET /api/admin/container ─────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = Container::with(['loaicontainer', 'chuyentau.hangtau']);

        // Mặc định ẩn khonghoatdong
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

    // ─── GET /api/admin/container/{container} ─────────────────────
    public function show(Container $container): JsonResponse
    {
        return response()->json([
            'data' => new ContainerResource($container->load(['loaicontainer', 'chuyentau.hangtau'])),
        ]);
    }

    // ─── POST /api/admin/container ────────────────────────────────
    // Đăng ký container mới = xe đã có mặt tại cổng, nên ghi nhận nhập cổng luôn
    // (đồng bộ với NhanVien\Cong\ContainerCongController::store())
    public function store(LuuContainer $request): JsonResponse
    {
        $container = DB::transaction(function () use ($request) {
            $now = now();

            $container = Container::create([
                ...$request->validated(),
                'trangthai'         => 'trongbai',
                'trangthai_haiquan' => 'chua_khai',
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

    // ─── PUT /api/admin/container/{container} ─────────────────────
    public function update(LuuContainer $request, Container $container): JsonResponse
    {
        if ($container->trangthai === 'khonghoatdong') {
            return response()->json([
                'message' => 'Không thể sửa container đã bị vô hiệu hóa.',
            ], 422);
        }

        if ($container->dangTrongBai()) {
            return response()->json([
                'message' => 'Không thể sửa container đang trong bãi.',
            ], 422);
        }

        $container->update($request->validated());

        return response()->json([
            'message' => "Cập nhật container {$container->socontainer} thành công.",
            'data'    => new ContainerResource($container->fresh()->load(['loaicontainer', 'chuyentau.hangtau'])),
        ]);
    }

    // ─── PATCH /api/admin/container/{container}/hai-quan ─────────
    // Khai báo luồng phân loại (Xanh/Vàng/Đỏ) — chỉ thực hiện được 1 lần khi hệ thống
    // hải quan trả kết quả phân luồng. Luồng là "nhãn" cố định, không đổi sau đó —
    // luồng vàng/đỏ muốn được thông quan phải qua kiểm hóa (xem BienBanKTController).
    public function capNhatHaiQuan(Request $request, Container $container): JsonResponse
    {
        $request->validate([
            'trangthai_haiquan' => 'required|in:luong_xanh,luong_vang,luong_do',
            'ghichu_haiquan'    => 'nullable|string|max:500',
        ]);

        if ($container->trangthai_haiquan !== 'chua_khai') {
            return response()->json([
                'message' => "Container {$container->socontainer} đã được phân luồng ({$container->trangthai_haiquan}) và không thể thay đổi. Nếu là luồng vàng/đỏ, hãy lập biên bản kiểm tra loại \"Hải quan\" để ghi nhận kết quả kiểm hóa.",
            ], 422);
        }

        $labelMap = ['luong_xanh' => 'Luồng xanh', 'luong_vang' => 'Luồng vàng', 'luong_do' => 'Luồng đỏ'];
        $moi = $request->trangthai_haiquan;

        // Luồng xanh không cần kiểm hóa — được thông quan ngay
        $container->update([
            'trangthai_haiquan' => $moi,
            'da_thong_quan'     => $moi === 'luong_xanh',
        ]);

        return response()->json([
            'message' => "Đã phân {$labelMap[$moi]} cho container {$container->socontainer}.",
            'data'    => new ContainerResource($container->fresh()->load(['loaicontainer', 'chuyentau.hangtau'])),
        ]);
    }

    // ─── DELETE /api/admin/container/{container} ──────────────────
    public function destroy(XoaContainer $request, Container $container): JsonResponse
    {
        if ($container->dangTrongBai()) {
            return response()->json([
                'message' => "Không thể xóa. Container {$container->socontainer} đang trong bãi.",
            ], 422);
        }

        if ($container->trangthai === 'khonghoatdong') {
            return response()->json(['message' => 'Container này đã bị vô hiệu hóa trước đó.'], 422);
        }

        $chuoiDungThan = "Delete {$container->socontainer}";
        if ($request->xacnhan_xoa !== $chuoiDungThan) {
            return response()->json([
                'message' => "Chuỗi xác nhận không đúng. Vui lòng gõ: \"{$chuoiDungThan}\"",
            ], 422);
        }

        LogXoa::create([
            'loaidoituong' => 'container',
            'madoituong'   => $container->macontainer,
            'tendoituong'  => $container->socontainer,
            'nguoixoa'     => $request->user()->mataikhoan,
            'lydo_xoa'     => $request->lydo_xoa,
            'chuoixacnhan' => $request->xacnhan_xoa,
            'thoigian_xoa' => now(),
        ]);

        $container->update(['trangthai' => 'khonghoatdong']);

        return response()->json([
            'message' => "Container {$container->socontainer} đã được vô hiệu hóa thành công.",
        ]);
    }
}
