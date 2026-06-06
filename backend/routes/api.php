<?php

use App\Http\Controllers\Admin\ChuyenTauController;
use App\Http\Controllers\Admin\ContainerController;
use App\Http\Controllers\Admin\HangTauController;
use App\Http\Controllers\Admin\KhuVucBaiController;
use App\Http\Controllers\Admin\LoaiContainerController;
use App\Http\Controllers\Admin\BienBanKTDController;
use App\Http\Controllers\Admin\LogCongController;
use App\Http\Controllers\Admin\TaiKhoanController;
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// ─── PUBLIC ──────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/login',    [AuthController::class, 'login']);
    Route::post('/register', [AuthController::class, 'register']);
});

// ─── PROTECTED ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('/logout',  [AuthController::class, 'logout']);
        Route::get('/me',       [AuthController::class, 'me']);
        Route::put('/profile',  [AuthController::class, 'capNhatThongTin']);
        Route::put('/password', [AuthController::class, 'doiMatKhau']);
    });

    // ─── ADMIN only ───────────────────────────────────────────────
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Loại container
        Route::get('loai-container',                            [LoaiContainerController::class, 'index']);
        Route::post('loai-container',                           [LoaiContainerController::class, 'store']);
        Route::get('loai-container/{loaicontainer}',            [LoaiContainerController::class, 'show']);
        Route::put('loai-container/{loaicontainer}',            [LoaiContainerController::class, 'update']);
        Route::delete('loai-container/{loaicontainer}',         [LoaiContainerController::class, 'destroy']);
        Route::patch('loai-container/{loaicontainer}/khoiphuc', [LoaiContainerController::class, 'khoiPhuc']);

        // Hãng tàu
        Route::get('hang-tau',                      [HangTauController::class, 'index']);
        Route::post('hang-tau',                     [HangTauController::class, 'store']);
        Route::get('hang-tau/{hangtau}',            [HangTauController::class, 'show']);
        Route::put('hang-tau/{hangtau}',            [HangTauController::class, 'update']);
        Route::delete('hang-tau/{hangtau}',         [HangTauController::class, 'destroy']);
        Route::patch('hang-tau/{hangtau}/khoiphuc', [HangTauController::class, 'khoiPhuc']);

        // Khu vực bãi
        Route::get('khu-vuc-bai',                         [KhuVucBaiController::class, 'index']);
        Route::post('khu-vuc-bai',                        [KhuVucBaiController::class, 'store']);
        Route::get('khu-vuc-bai/{khuvucbai}',             [KhuVucBaiController::class, 'show']);
        Route::put('khu-vuc-bai/{khuvucbai}',             [KhuVucBaiController::class, 'update']);
        Route::delete('khu-vuc-bai/{khuvucbai}',          [KhuVucBaiController::class, 'destroy']);
        Route::patch('khu-vuc-bai/{khuvucbai}/khoiphuc',  [KhuVucBaiController::class, 'khoiPhuc']);

        // Container
        Route::get('container',                         [ContainerController::class, 'index']);
        Route::post('container',                        [ContainerController::class, 'store']);
        Route::get('container/lookup',                  [ContainerController::class, 'lookup']);
        Route::get('container/{container}',             [ContainerController::class, 'show']);
        Route::put('container/{container}',             [ContainerController::class, 'update']);
        Route::delete('container/{container}',          [ContainerController::class, 'destroy']);

        // Danh sách tài xế (dùng cho dropdown)
        Route::get('tai-xe', function () {
            return response()->json([
                'data' => \App\Models\TaiXe::where('trangthai', 'hoatdong')
                    ->select('mataixe', 'hoten', 'sodienthoai')
                    ->orderBy('hoten')
                    ->get(),
            ]);
        });

        // Cổng xuất nhập
        Route::get('cong',          [LogCongController::class, 'index']);
        Route::post('cong',         [LogCongController::class, 'store']);

        // Biên bản kiểm tra định kỳ
        Route::get('bien-ban-ktd',  [BienBanKTDController::class, 'index']);
        Route::post('bien-ban-ktd', [BienBanKTDController::class, 'store']);

        // Tài khoản
        Route::get('tai-khoan',                                [TaiKhoanController::class, 'index']);
        Route::post('tai-khoan',                               [TaiKhoanController::class, 'store']);
        Route::put('tai-khoan/{user}',                         [TaiKhoanController::class, 'update']);
        Route::patch('tai-khoan/{user}/vo-hieu-hoa',           [TaiKhoanController::class, 'voHieuHoa']);
        Route::patch('tai-khoan/{user}/khoiphuc',              [TaiKhoanController::class, 'khoiPhuc']);
        Route::patch('tai-khoan/{user}/reset-mat-khau',        [TaiKhoanController::class, 'resetMatKhau']);

        // Lịch tàu
        Route::get('lich-tau',                    [ChuyenTauController::class, 'index']);
        Route::post('lich-tau',                   [ChuyenTauController::class, 'store']);
        Route::put('lich-tau/{chuyentau}',        [ChuyenTauController::class, 'update']);
        Route::delete('lich-tau/{chuyentau}',     [ChuyenTauController::class, 'destroy']);
    });

    // ─── ADMIN + NHANVIEN ─────────────────────────────────────────
    Route::middleware('role:admin,nhanvien')->prefix('nv')->group(function () {
        // Container, Gate, Bai... sẽ bổ sung ở đây
    });

    // ─── KHACH HANG ───────────────────────────────────────────────
    Route::middleware('role:khachhang')->prefix('kh')->group(function () {
        // Booking, theo dõi... sẽ bổ sung ở đây
    });

    // ─── TAI XE ───────────────────────────────────────────────────
    Route::middleware('role:taixe')->prefix('tx')->group(function () {
        // Chuyến, QR... sẽ bổ sung ở đây
    });
});