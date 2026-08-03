<?php

namespace App\Http\Controllers\KhachHang;

use App\Http\Controllers\Controller;
use App\Http\Resources\ContainerResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\LogCong;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContainerKHController extends Controller
{
    // GET /api/kh/container
    public function index(Request $request): JsonResponse
    {
        $makh  = $request->user()->mataikhoan;
        $query = Container::with(['loaicontainer', 'chuyentau.hangtau'])
            ->where('makhachhang', $makh);

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        } else {
            $query->whereNotIn('trangthai', ['khonghoatdong']);
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

    // POST /api/kh/container/nhan-theo-van-don
    // Liên kết container hàng NHẬP về tài khoản khách hàng — vì container nhập tạo
    // qua Import Manifest không hề có makhachhang (khách không đăng nhập lúc đó),
    // khách phải chủ động "nhận" bằng số vận đơn (biết từ giấy tờ thực tế ngoài hệ
    // thống) để tự xác nhận quyền sở hữu. Sau bước này, container mới xuất hiện
    // trong containerTrongBai() và tạo được phiếu lấy hàng bình thường.
    public function nhanTheoVanDon(Request $request): JsonResponse
    {
        $request->validate([
            'so_vandon' => 'required|string|max:50',
        ], [
            'so_vandon.required' => 'Vui lòng nhập số vận đơn.',
        ]);

        $soVanDon = trim($request->so_vandon);

        // Vận đơn do hãng tàu cấp, đủ dài/khó đoán tương tự số container — không cần
        // xác thực thêm yếu tố thứ 2 (không phân biệt hoa thường khi so khớp).
        $containers = Container::where('loai_hinh', 'nhap')
            ->whereRaw('UPPER(so_vandon) = ?', [mb_strtoupper($soVanDon)])
            ->whereNull('makhachhang')
            ->get();

        if ($containers->isEmpty()) {
            return response()->json([
                'message' => 'Không tìm thấy lô hàng phù hợp với thông tin đã nhập, hoặc lô hàng đã được nhận trước đó.',
            ], 422);
        }

        $makh = $request->user()->mataikhoan;

        // Gán makhachhang cho TẤT CẢ container cùng vận đơn — 1 lô hàng có thể có
        // nhiều container, khách nhận 1 lần là được cả lô, không cần lặp lại.
        Container::whereIn('macontainer', $containers->pluck('macontainer'))
            ->update(['makhachhang' => $makh]);

        $containers->each(fn ($c) => $c->makhachhang = $makh);

        return response()->json([
            'message' => "Đã nhận thành công {$containers->count()} container thuộc vận đơn {$soVanDon}.",
            'data'    => ContainerResource::collection($containers),
        ]);
    }

    // GET /api/kh/container/{container}
    public function show(Request $request, Container $container): JsonResponse
    {
        if ($container->makhachhang !== $request->user()->mataikhoan) {
            return response()->json(['message' => 'Không có quyền truy cập.'], 403);
        }

        $container->load(['loaicontainer', 'chuyentau.hangtau']);

        // Timeline: lịch sử vào/ra
        $logs = LogCong::where('macontainer', $container->macontainer)
            ->orderBy('thoigian_xl')
            ->get()
            ->map(fn ($l) => [
                'loai'        => $l->kieu_xuatnhap === 'nhap' ? 'Nhập bãi' : 'Xuất cổng',
                'thoigian'    => $l->thoigian_xl?->format('d/m/Y H:i'),
                'ghichu'      => $l->ghichu,
            ]);

        // Vị trí hiện tại
        $vitri = LichSuViTri::with(['obai.khuvucbai'])
            ->where('macontainer', $container->macontainer)
            ->whereNull('thoigian_roi')
            ->latest('thoigian_gan')
            ->first();

        // Phí lưu bãi ước tính (đơn giản: số ngày × đơn giá theo loại)
        $soNgay   = null;
        $phiUocTinh = null;
        if ($container->thoigian_vaobai && $container->trangthai === 'trongbai') {
            $soNgay     = max(0, (int) $container->thoigian_vaobai->diffInDays(now()));
            $ngayMienPhi = 5;
            $ngayTinhPhi = max(0, $soNgay - $ngayMienPhi);
            $donGia      = str_contains($container->loaicontainer?->tenloai ?? '', '40') ? 200000 : 100000;
            $phiUocTinh  = $ngayTinhPhi * $donGia;
        }

        return response()->json([
            'data' => new ContainerResource($container),
            'vitri_hien_tai' => $vitri ? [
                'maobai_code' => $vitri->obai->maobai_code ?? null,
                'tenblock'    => $vitri->obai->khuvucbai->tenblock ?? null,
                'khoang'      => $vitri->obai->khoang ?? null,
                'hang'        => $vitri->obai->hang ?? null,
                'tang'        => $vitri->obai->tang ?? null,
            ] : null,
            'so_ngay_luu_bai' => $soNgay,
            'phi_uoc_tinh'    => $phiUocTinh,
            'timeline'        => $logs,
        ]);
    }
}
