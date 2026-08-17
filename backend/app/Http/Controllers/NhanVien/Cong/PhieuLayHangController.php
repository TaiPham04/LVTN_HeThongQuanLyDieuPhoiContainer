<?php

namespace App\Http\Controllers\NhanVien\Cong;

use App\Exceptions\LogCongException;
use App\Http\Controllers\Controller;
use App\Http\Requests\PhieuLayHang\TaoPhieu;
use App\Http\Resources\PhieuLayHangResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\LogCong;
use App\Models\OBai;
use App\Models\PhieuLayHang;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class PhieuLayHangController extends Controller
{
    // Phiếu do nhân viên cổng xuất có hiệu lực 4 giờ — khung ETA phải khớp đúng khoảng này
    private const HIEU_LUC_GIO = 4;

    // GET /api/nv/cong/phieu-lay-hang
    public function index(Request $request): JsonResponse
    {
        // Tự động đánh dấu hết hạn trước khi truy vấn
        PhieuLayHang::where('trangthai', 'cho_lay')
            ->where('thoigian_het_han', '<', now())
            ->update(['trangthai' => 'het_han']);

        $query = PhieuLayHang::with(['container.chuyentau.hangtau', 'nhanvien', 'taixe']);

        if ($request->search) {
            $query->whereHas('container', fn($q) =>
                $q->where('socontainer', 'like', "%{$request->search}%")
            );
        }

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        }

        if ($request->ngay) {
            $query->whereDate('thoigian_xuat', $request->ngay);
        }

        $data = $query->orderBy('thoigian_xuat', 'desc')
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => PhieuLayHangResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // POST /api/nv/cong/phieu-lay-hang
    public function store(TaoPhieu $request): JsonResponse
    {
        $socontainer = strtoupper(trim($request->socontainer));

        $container = Container::where('socontainer', $socontainer)->first();

        if (!$container) {
            return response()->json(['message' => "Không tìm thấy container {$socontainer}."], 404);
        }

        if ($container->trangthai !== 'trongbai') {
            $label = match($container->trangthai) {
                'xuatcong'  => 'đã xuất khỏi cảng',
                'dalenken'  => 'đã lên tàu',
                default     => $container->trangthai,
            };
            return response()->json([
                'message' => "Container {$socontainer} không đang trong bãi ({$label}). Không thể xuất phiếu."
            ], 422);
        }

        // Kiểm tra phiếu còn hiệu lực cho container này
        $phieuConHieuLuc = PhieuLayHang::where('macontainer', $container->macontainer)
            ->where('trangthai', 'cho_lay')
            ->where('thoigian_het_han', '>', now())
            ->first();

        if ($phieuConHieuLuc) {
            return response()->json([
                'message' => "Container {$socontainer} đã có phiếu lấy hàng còn hiệu lực (hết hạn lúc {$phieuConHieuLuc->thoigian_het_han->format('H:i d/m/Y')}). Hủy phiếu cũ trước khi xuất phiếu mới.",
                'maphieu_cu' => $phieuConHieuLuc->maphieu,
            ], 422);
        }

        // Lấy vị trí hiện tại
        $lichsu = LichSuViTri::with(['obai.khuvucbai'])
            ->where('macontainer', $container->macontainer)
            ->whereNull('thoigian_roi')
            ->latest('thoigian_gan')
            ->first();

        if (!$lichsu || !$lichsu->obai) {
            return response()->json([
                'message' => "Container {$socontainer} chưa được gán vị trí trong bãi."
            ], 422);
        }

        $obai   = $lichsu->obai;
        $khuvuc = $obai->khuvucbai;

        $vitriSnapshot = [
            'maobai'      => $obai->maobai,
            'maobai_code' => $obai->maobai_code,
            'tenblock'    => $khuvuc?->tenblock,
            'khoang'      => $obai->khoang,
            'hang'        => $obai->hang,
            'tang'        => $obai->tang,
        ];

        $thoiGianXuat   = now();
        $thoiGianHetHan = $thoiGianXuat->copy()->addHours(self::HIEU_LUC_GIO);

        // Khung ETA phải khớp đúng thời hạn hiệu lực của phiếu (4h): chỉ cần nhân viên
        // nhập 1 trong 2 mốc, mốc còn lại được hệ thống tự tính theo HIEU_LUC_GIO.
        $etaTu  = $request->eta_tu  ? Carbon::parse($request->eta_tu)  : null;
        $etaDen = $request->eta_den ? Carbon::parse($request->eta_den) : null;

        if ($etaTu) {
            $etaDen = $etaTu->copy()->addHours(self::HIEU_LUC_GIO);
        } elseif ($etaDen) {
            $etaTu = $etaDen->copy()->subHours(self::HIEU_LUC_GIO);
        }

        if ($etaTu && $etaTu->lt($thoiGianXuat)) {
            return response()->json(['message' => 'Thời gian ETA không được ở trong quá khứ.'], 422);
        }

        $phieu = PhieuLayHang::create([
            'macontainer'      => $container->macontainer,
            'manhanvien'       => $request->user()->mataikhoan,
            'mataixe'          => $request->mataixe,
            'biensoxe'         => $request->biensoxe,
            'bienso_romo'      => $request->bienso_romo,
            'vitri_snapshot'   => $vitriSnapshot,
            'ma_qr'            => Str::upper(Str::random(8)) . '-' . Str::upper(Str::random(8)) . '-' . Str::upper(Str::random(8)),
            'trangthai'        => 'cho_lay',
            'thoigian_xuat'    => $thoiGianXuat,
            'thoigian_het_han' => $thoiGianHetHan,
            'eta_tu'           => $etaTu,
            'eta_den'          => $etaDen,
            'ghichu'           => $request->ghichu,
        ]);

        return response()->json([
            'message' => "Xuất phiếu lấy hàng container {$socontainer} thành công.",
            'data'    => new PhieuLayHangResource(
                $phieu->load(['container.chuyentau.hangtau', 'nhanvien', 'taixe'])
            ),
        ], 201);
    }

    // GET /api/nv/cong/phieu-lay-hang/{maphieu}
    public function show(PhieuLayHang $phieu): JsonResponse
    {
        $this->capNhatHetHanNeuCan($phieu);

        return response()->json([
            'data' => new PhieuLayHangResource(
                $phieu->load(['container.chuyentau.hangtau', 'nhanvien', 'taixe'])
            ),
        ]);
    }

    // PATCH /api/nv/cong/phieu-lay-hang/{maphieu}/xac-nhan
    public function xacNhan(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $this->capNhatHetHanNeuCan($phieu);

        if ($phieu->trangthai === 'het_han') {
            return response()->json(['message' => 'Phiếu đã hết hạn, không thể xác nhận.'], 422);
        }

        if ($phieu->trangthai !== 'cho_lay') {
            return response()->json(['message' => 'Phiếu này không ở trạng thái chờ lấy hàng.'], 422);
        }

        $container = Container::findOrFail($phieu->macontainer);

        if ($container->trangthai !== 'trongbai') {
            return response()->json(['message' => 'Container không còn trong bãi, không thể xác nhận.'], 422);
        }

        try {
            DB::transaction(function () use ($request, $phieu, $container) {
                $now = now();

                LogCong::create([
                    'macontainer'   => $container->macontainer,
                    'maphieu'       => $phieu->maphieu,
                    'machuyentau'   => $container->machuyentau,
                    'mataixe'       => $phieu->mataixe,
                    // Người đang xác nhận tại cổng — không phải người đã phát phiếu trước đó
                    'manhanvien'    => $request->user()->mataikhoan,
                    'kieu_xuatnhap' => 'xuat',
                    'biensoxe'      => $phieu->biensoxe,
                    // Luồng xuất theo phiếu QR không có bước nhập niêm chì riêng — để null
                    // (chưa kiểm tra) thay vì hard-code false (sai lệch thành "không đạt").
                    'niemchi_ok'    => null,
                    'haiquan_ok'    => $container->da_thong_quan,
                    'ghichu'        => "Xuất theo phiếu lấy hàng #{$phieu->maphieu}",
                    'thoigian_xl'   => $now,
                ]);

                $container->update([
                    'trangthai'      => 'xuatcong',
                    'thoigian_rabai' => $now,
                ]);

                // Giải phóng ô bãi đang chiếm — nếu không, ô sẽ kẹt vĩnh viễn ở 'dangsudung'.
                // Phải khóa + kiểm tra "có container xếp trên ô này không" trước khi giải
                // phóng — nếu không, tài xế lấy container tầng dưới trong khi tầng trên
                // vẫn còn container sẽ tạo trạng thái lơ lửng phi vật lý.
                $viTriHienTai = LichSuViTri::where('macontainer', $container->macontainer)
                    ->whereNull('thoigian_roi')
                    ->first();
                if ($viTriHienTai) {
                    $obaiHienTai = OBai::where('maobai', $viTriHienTai->maobai)->lockForUpdate()->first();
                    if ($obaiHienTai?->coContTrenDau()) {
                        throw new LogCongException("Không thể cho {$container->socontainer} ra cổng — đang có container khác xếp trên ô của nó, phải đảo chuyển container phía trên trước.");
                    }
                    $obaiHienTai?->update(['trangthai' => 'trong']);
                }

                LichSuViTri::where('macontainer', $container->macontainer)
                    ->whereNull('thoigian_roi')
                    ->update(['thoigian_roi' => $now]);

                $phieu->update([
                    'trangthai'    => 'da_lay',
                    'thoigian_lay' => $now,
                ]);
            });
        } catch (LogCongException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => 'Xác nhận đã lấy hàng thành công. Container đã được ghi nhận xuất cổng.',
            'data'    => new PhieuLayHangResource(
                $phieu->load(['container.chuyentau.hangtau', 'nhanvien', 'taixe'])
            ),
        ]);
    }

    // PATCH /api/nv/cong/phieu-lay-hang/{maphieu}/huy
    public function huy(PhieuLayHang $phieu): JsonResponse
    {
        $this->capNhatHetHanNeuCan($phieu);

        if (!in_array($phieu->trangthai, ['cho_lay'])) {
            $msg = $phieu->trangthai === 'het_han'
                ? 'Phiếu đã hết hạn.'
                : 'Chỉ có thể hủy phiếu đang chờ lấy hàng.';
            return response()->json(['message' => $msg], 422);
        }

        $phieu->update(['trangthai' => 'huy']);

        return response()->json(['message' => 'Đã hủy phiếu.']);
    }

    // GET /api/nv/cong/phieu-lay-hang/scan-qr?ma_qr=XXXX
    public function scanQR(Request $request): JsonResponse
    {
        $request->validate(['ma_qr' => 'required|string|max:30']);

        $phieu = PhieuLayHang::with(['container.chuyentau.hangtau', 'nhanvien', 'taixe'])
            ->where('ma_qr', $request->ma_qr)
            ->first();

        if (!$phieu) {
            return response()->json(['message' => 'Không tìm thấy phiếu với mã QR này.'], 404);
        }

        $this->capNhatHetHanNeuCan($phieu);

        return response()->json([
            'data' => new PhieuLayHangResource(
                $phieu->fresh()->load(['container.chuyentau.hangtau', 'nhanvien', 'taixe'])
            ),
        ]);
    }

    // PATCH /api/nv/cong/phieu-lay-hang/{phieu}/vao-cong
    public function vaoCong(Request $request, PhieuLayHang $phieu): JsonResponse
    {
        $request->validate([
            'bienso_romo' => 'nullable|string|max:20',
        ]);

        $this->capNhatHetHanNeuCan($phieu);

        if ($phieu->trangthai === 'het_han') {
            return response()->json(['message' => 'Phiếu đã hết hạn, không thể cho vào cổng.'], 422);
        }

        if ($phieu->trangthai !== 'cho_lay') {
            return response()->json(['message' => 'Phiếu không ở trạng thái hợp lệ.'], 422);
        }

        if ($phieu->thoigian_vao_cong) {
            return response()->json(['message' => 'Xe này đã được ghi nhận vào cổng trước đó.'], 422);
        }

        if (!$phieu->mataixe || !$phieu->biensoxe) {
            return response()->json([
                'message' => 'Phiếu chưa có thông tin tài xế và biển số xe đầu kéo. Khách hàng cần cập nhật trước khi vào cổng.',
            ], 422);
        }

        $update = ['thoigian_vao_cong' => now()];
        if ($request->filled('bienso_romo')) {
            $update['bienso_romo'] = $request->bienso_romo;
        }

        $phieu->update($update);

        return response()->json([
            'message' => 'Ghi nhận xe vào cổng thành công.',
            'data'    => new PhieuLayHangResource(
                $phieu->fresh()->load(['container.chuyentau.hangtau', 'nhanvien', 'taixe'])
            ),
        ]);
    }

    // ── helper: tự động chuyển sang het_han nếu quá thời hạn ─────
    private function capNhatHetHanNeuCan(PhieuLayHang $phieu): void
    {
        if ($phieu->trangthai === 'cho_lay' && $phieu->thoigian_het_han < now()) {
            $phieu->update(['trangthai' => 'het_han']);
            $phieu->refresh();
        }
    }
}
