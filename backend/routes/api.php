<?php

use App\Http\Controllers\Admin\BaoCaoController;
use App\Http\Controllers\Admin\BienBanKTController;
use App\Http\Controllers\Admin\ChuyenTauController;
use App\Http\Controllers\Admin\ContainerController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\HangTauController;
use App\Http\Controllers\Admin\KhuVucBaiController;
use App\Http\Controllers\Admin\LoaiContainerController;
use App\Http\Controllers\Admin\LogCongController;
use App\Http\Controllers\Admin\SoDoBaiController;
use App\Http\Controllers\Admin\TaiKhoanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\NhanVien\Bai\ContainerBaiController;
use App\Http\Controllers\NhanVien\Bai\SoDoBaiController as NVSoDoBaiController;
use App\Http\Controllers\NhanVien\Cong\BienBanKTController as NVBienBanKTController;
use App\Http\Controllers\NhanVien\Cong\ContainerCongController;
use App\Http\Controllers\NhanVien\Cong\LichTauController as NVLichTauController;
use App\Http\Controllers\NhanVien\Cong\LogCongController as NVLogCongController;
use Illuminate\Support\Facades\Route;

// ─── PUBLIC ──────────────────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// ─── PROTECTED ───────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::get('/me',       [AuthController::class, 'me']);
        Route::put('/profile',  [AuthController::class, 'capNhatThongTin']);
        Route::put('/password', [AuthController::class, 'doiMatKhau']);
    });

    // ─── ADMIN ───────────────────────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Dashboard
        Route::get('dashboard', [DashboardController::class, 'index']);

        // Báo cáo
        Route::get('bao-cao/xuat-nhap', [BaoCaoController::class, 'xuatNhap']);
        Route::get('bao-cao/container', [BaoCaoController::class, 'container']);
        Route::get('bao-cao/hang-tau',  [BaoCaoController::class, 'hangTau']);

        // Loại container
        Route::get('loai-container',                              [LoaiContainerController::class, 'index']);
        Route::get('loai-container/{loaicontainer}',              [LoaiContainerController::class, 'show']);
        Route::post('loai-container',                             [LoaiContainerController::class, 'store']);
        Route::put('loai-container/{loaicontainer}',              [LoaiContainerController::class, 'update']);
        Route::delete('loai-container/{loaicontainer}',           [LoaiContainerController::class, 'destroy']);
        Route::patch('loai-container/{loaicontainer}/khoiphuc',   [LoaiContainerController::class, 'khoiPhuc']);

        // Hãng tàu
        Route::get('hang-tau',                     [HangTauController::class, 'index']);
        Route::get('hang-tau/{hangtau}',            [HangTauController::class, 'show']);
        Route::post('hang-tau',                     [HangTauController::class, 'store']);
        Route::put('hang-tau/{hangtau}',            [HangTauController::class, 'update']);
        Route::delete('hang-tau/{hangtau}',         [HangTauController::class, 'destroy']);
        Route::patch('hang-tau/{hangtau}/khoiphuc', [HangTauController::class, 'khoiPhuc']);

        // Khu vực bãi
        Route::get('khu-vuc-bai',                        [KhuVucBaiController::class, 'index']);
        Route::get('khu-vuc-bai/{khuvucbai}',             [KhuVucBaiController::class, 'show']);
        Route::post('khu-vuc-bai',                        [KhuVucBaiController::class, 'store']);
        Route::put('khu-vuc-bai/{khuvucbai}',             [KhuVucBaiController::class, 'update']);
        Route::delete('khu-vuc-bai/{khuvucbai}',          [KhuVucBaiController::class, 'destroy']);
        Route::patch('khu-vuc-bai/{khuvucbai}/khoiphuc',  [KhuVucBaiController::class, 'khoiPhuc']);

        // Container
        Route::get('container',             [ContainerController::class, 'index']);
        Route::get('container/lookup',      [ContainerController::class, 'lookup']);
        Route::get('container/{container}', [ContainerController::class, 'show']);
        Route::post('container',            [ContainerController::class, 'store']);
        Route::put('container/{container}', [ContainerController::class, 'update']);
        Route::delete('container/{container}', [ContainerController::class, 'destroy']);

        // Lịch tàu
        Route::get('lich-tau',                           [ChuyenTauController::class, 'index']);
        Route::post('lich-tau',                          [ChuyenTauController::class, 'store']);
        Route::put('lich-tau/{chuyentau}',               [ChuyenTauController::class, 'update']);
        Route::delete('lich-tau/{chuyentau}',            [ChuyenTauController::class, 'destroy']);
        Route::patch('lich-tau/{chuyentau}/trang-thai',  [ChuyenTauController::class, 'chuyenTrangThai']);

        // Cổng xuất nhập
        Route::get('cong',  [LogCongController::class, 'index']);
        Route::post('cong', [LogCongController::class, 'store']);

        // Biên bản KTĐ
        Route::get('bien-ban-kt',  [BienBanKTController::class, 'index']);
        Route::post('bien-ban-kt', [BienBanKTController::class, 'store']);

        // Sơ đồ bãi
        Route::get('so-do-bai',                           [SoDoBaiController::class, 'index']);
        Route::get('so-do-bai/cho-gan-vitri',             [SoDoBaiController::class, 'choGanViTri']);
        Route::get('so-do-bai/goi-y-vitri/{container}',   [SoDoBaiController::class, 'goiYViTri']);
        Route::get('so-do-bai/goi-y-daochuyen/{obai}',   [SoDoBaiController::class, 'goiYDaoChuyen']);
        Route::get('so-do-bai/{khuvucbai}',               [SoDoBaiController::class, 'show']);
        Route::post('so-do-bai/gan-vitri',                [SoDoBaiController::class, 'ganVitri']);
        Route::post('so-do-bai/daochuyen',                [SoDoBaiController::class, 'daoChuyen']);

        // Tài khoản
        Route::get('tai-khoan',                         [TaiKhoanController::class, 'index']);
        Route::post('tai-khoan',                        [TaiKhoanController::class, 'store']);
        Route::put('tai-khoan/{user}',                  [TaiKhoanController::class, 'update']);
        Route::patch('tai-khoan/{user}/vo-hieu-hoa',    [TaiKhoanController::class, 'voHieuHoa']);
        Route::patch('tai-khoan/{user}/khoiphuc',       [TaiKhoanController::class, 'khoiPhuc']);
        Route::patch('tai-khoan/{user}/reset-mat-khau', [TaiKhoanController::class, 'resetMatKhau']);

        // Danh sách tài xế (dùng cho dropdown)
        Route::get('tai-xe', function () {
            return response()->json([
                'data' => \App\Models\TaiXe::where('trangthai', 'hoatdong')
                    ->select('mataixe', 'hoten', 'sodienthoai')
                    ->orderBy('hoten')
                    ->get(),
            ]);
        });
    });

    // ─── NHÂN VIÊN CỔNG ──────────────────────────────────────────────────────
    Route::middleware('role:nhanvien_cong')->prefix('nv/cong')->group(function () {

        // Container — đăng ký và tra cứu (không sửa/xóa)
        Route::get('container',             [ContainerCongController::class, 'index']);
        Route::get('container/lookup',      [ContainerCongController::class, 'lookup']);
        Route::get('container/{container}', [ContainerCongController::class, 'show']);
        Route::post('container',            [ContainerCongController::class, 'store']);

        // Lịch tàu — xem + chuyển trạng thái (không CRUD)
        Route::get('lich-tau',                          [NVLichTauController::class, 'index']);
        Route::patch('lich-tau/{chuyentau}/trang-thai', [NVLichTauController::class, 'chuyenTrangThai']);

        // Cổng xuất nhập
        Route::get('cong',  [NVLogCongController::class, 'index']);
        Route::post('cong', [NVLogCongController::class, 'store']);

        // Biên bản KTĐ
        Route::get('bien-ban-kt',  [NVBienBanKTController::class, 'index']);
        Route::post('bien-ban-kt', [NVBienBanKTController::class, 'store']);

        // Lookups dùng chung (hãng tàu, loại container, tài xế)
        Route::get('hang-tau',           [HangTauController::class, 'index']);
        Route::get('loai-container',     [LoaiContainerController::class, 'index']);
        Route::get('tai-xe', function () {
            return response()->json([
                'data' => \App\Models\TaiXe::where('trangthai', 'hoatdong')
                    ->select('mataixe', 'hoten', 'sodienthoai')
                    ->orderBy('hoten')
                    ->get(),
            ]);
        });
    });

    // ─── NHÂN VIÊN BÃI ───────────────────────────────────────────────────────
    Route::middleware('role:nhanvien_bai')->prefix('nv/bai')->group(function () {

        // Container — chỉ xem
        Route::get('container',             [ContainerBaiController::class, 'index']);
        Route::get('container/{container}', [ContainerBaiController::class, 'show']);

        // Sơ đồ bãi — toàn bộ tính năng
        Route::get('so-do-bai',                           [NVSoDoBaiController::class, 'index']);
        Route::get('so-do-bai/cho-gan-vitri',             [NVSoDoBaiController::class, 'choGanViTri']);
        Route::get('so-do-bai/goi-y-vitri/{container}',   [NVSoDoBaiController::class, 'goiYViTri']);
        Route::get('so-do-bai/goi-y-daochuyen/{obai}',   [NVSoDoBaiController::class, 'goiYDaoChuyen']);
        Route::get('so-do-bai/{khuvucbai}',               [NVSoDoBaiController::class, 'show']);
        Route::post('so-do-bai/gan-vitri',                [NVSoDoBaiController::class, 'ganVitri']);
        Route::post('so-do-bai/daochuyen',                [NVSoDoBaiController::class, 'daoChuyen']);

        // Lookups dùng chung
        Route::get('hang-tau',  [HangTauController::class, 'index']);
        Route::get('khu-vuc-bai', [KhuVucBaiController::class, 'index']);
    });

    // ─── KHÁCH HÀNG ──────────────────────────────────────────────────────────
    Route::middleware('role:khachhang')->prefix('kh')->group(function () {
        // Booking, theo dõi... sẽ bổ sung ở đây
    });

    // ─── TÀI XẾ ──────────────────────────────────────────────────────────────
    Route::middleware('role:taixe')->prefix('tx')->group(function () {
        // Chuyến, QR... sẽ bổ sung ở đây
    });
});
