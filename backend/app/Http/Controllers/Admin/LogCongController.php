<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\LogCong\GhiNhanXuatNhap;
use App\Http\Resources\LogCongResource;
use App\Models\Container;
use App\Models\LichSuViTri;
use App\Models\LogCong;
use App\Models\OBai;
use App\Models\PhieuLayHang;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LogCongController extends Controller
{
    // ─── GET /api/admin/cong ──────────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = LogCong::with(['container.chuyentau.hangtau', 'chuyentau', 'taixe', 'nhanvien']);

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
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => LogCongResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
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

            // Khung thời gian hạ bãi — chỉ áp dụng cho hàng xuất (hàng nhập vào bãi
            // qua module Tally sau khi tàu cập cảng, không qua cổng theo lịch đặt chỗ).
            if ($container->loai_hinh === 'xuat' && $container->chuyentau && !$container->chuyentau->trongKhungHaBai()) {
                return response()->json(['message' => $container->chuyentau->thongBaoNgoaiKhungHaBai()], 422);
            }
        } else {
            if ($container->trangthai !== 'trongbai') {
                return response()->json([
                    'message' => "Container {$container->socontainer} không đang trong bãi (trạng thái: {$container->trangthai}).",
                ], 422);
            }
            if (!$container->da_thong_quan) {
                $nhan = match($container->trangthai_haiquan) {
                    'luong_vang' => 'luồng vàng — đang chờ kiểm hóa',
                    'luong_do'   => 'luồng đỏ — đang chờ kiểm hóa',
                    default      => 'chưa khai báo hải quan',
                };
                return response()->json([
                    'message' => "Container {$container->socontainer} chưa được thông quan ({$nhan}). Không thể xuất khỏi bãi.",
                ], 422);
            }

            // Nhân viên phải có phiếu lấy hàng hợp lệ mới cho xuất — đồng bộ với
            // NhanVien\Cong\LogCongController (trước đây bản admin thiếu kiểm tra này)
            $phieu = PhieuLayHang::where('macontainer', $container->macontainer)
                ->where('trangthai', 'cho_lay')
                ->where('thoigian_het_han', '>', now())
                ->first();

            if (!$phieu) {
                return response()->json([
                    'message' => "Container {$container->socontainer} chưa có phiếu lấy hàng hợp lệ. Vui lòng xuất phiếu trước khi cho ra cổng.",
                ], 422);
            }
        }

        $log  = null;
        $phieu = $phieu ?? null;

        DB::transaction(function () use ($request, $container, &$log, $phieu) {
            $now = now();

            $log = LogCong::create([
                'macontainer'   => $container->macontainer,
                'maphieu'       => $phieu?->maphieu,
                'machuyentau'   => $request->machuyentau,
                'mataixe'       => $request->mataixe,
                'manhanvien'    => $request->user()->mataikhoan,
                'kieu_xuatnhap' => $request->kieu_xuatnhap,
                'biensoxe'      => $request->biensoxe,
                'niemchi_ktra'  => $request->niemchi_ktra,
                'niemchi_ok'    => $request->niemchi_ok,
                'haiquan_ok'    => $container->da_thong_quan,
                'ghichu'        => $request->ghichu,
                'thoigian_xl'   => $now,
            ]);

            if ($request->kieu_xuatnhap === 'nhap') {
                $container->update([
                    'trangthai'       => 'trongbai',
                    'thoigian_vaobai' => $now,
                ]);
            } else {
                $container->update([
                    'trangthai'      => 'xuatcong',
                    'thoigian_rabai' => $now,
                ]);

                // Giải phóng ô bãi đang chiếm — nếu không, ô sẽ kẹt vĩnh viễn ở 'dangsudung'
                $viTriHienTai = LichSuViTri::where('macontainer', $container->macontainer)
                    ->whereNull('thoigian_roi')
                    ->first();
                if ($viTriHienTai) {
                    OBai::where('maobai', $viTriHienTai->maobai)->update(['trangthai' => 'trong']);
                }

                LichSuViTri::where('macontainer', $container->macontainer)
                    ->whereNull('thoigian_roi')
                    ->update(['thoigian_roi' => $now]);

                if ($phieu) {
                    $phieu->update(['trangthai' => 'da_lay', 'thoigian_lay' => $now]);
                }
            }
        });

        $label = $request->kieu_xuatnhap === 'nhap' ? 'nhập bãi' : 'xuất bãi';

        return response()->json([
            'message' => "Ghi nhận {$label} container {$container->socontainer} thành công.",
            'data'    => new LogCongResource($log->load(['container.chuyentau.hangtau', 'chuyentau', 'taixe', 'nhanvien'])),
        ], 201);
    }
}
