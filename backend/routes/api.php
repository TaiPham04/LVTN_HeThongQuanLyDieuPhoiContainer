<?php

use App\Http\Controllers\Admin\BaoCaoController;
use App\Http\Controllers\Admin\ManifestController;
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
use App\Http\Controllers\NhanVien\Bai\BienBanKTController as NVBaiBienBanKTController;
use App\Http\Controllers\NhanVien\Cong\ContainerCongController;
use App\Http\Controllers\NhanVien\Bai\LichTauBaiController;
use App\Http\Controllers\NhanVien\Cong\LichTauController as NVLichTauController;
use App\Http\Controllers\NhanVien\Cong\LogCongController as NVLogCongController;
use App\Http\Controllers\NhanVien\Cong\PhieuLayHangController as NVPhieuLayHangController;
use App\Http\Controllers\KhachHang\DashboardKHController;
use App\Http\Controllers\KhachHang\BookingKHController;
use App\Http\Controllers\KhachHang\ContainerKHController;
use App\Http\Controllers\KhachHang\PhieuLayHangKHController;
use App\Http\Controllers\KhachHang\TaiXeKHController;
use App\Http\Controllers\TaiXe\PhieuLayHangTXController;
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

        // Manifest nhập khẩu
        Route::get('manifest/template',              [ManifestController::class, 'template']);
        Route::post('manifest/import',               [ManifestController::class, 'import']);
        Route::post('manifest/import-force',         [ManifestController::class, 'importForce']);
        Route::get('manifest/danh-sach/{machuyentau}', [ManifestController::class, 'danhSach']);

        // Báo cáo
        Route::get('bao-cao/xuat-nhap', [BaoCaoController::class, 'xuatNhap']);
        Route::get('bao-cao/container', [BaoCaoController::class, 'container']);
        Route::get('bao-cao/hang-tau',  [BaoCaoController::class, 'hangTau']);
        Route::get('bao-cao/ton-bai',   [BaoCaoController::class, 'tonBai']);
        Route::get('bao-cao/kpi',       [BaoCaoController::class, 'kpi']);

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
        Route::get('container',                                [ContainerController::class, 'index']);
        Route::get('container/lookup',                         [ContainerController::class, 'lookup']);
        Route::get('container/tra-cuu',                        [ContainerController::class, 'traCuu']);
        Route::get('container/{container}',                    [ContainerController::class, 'show']);
        Route::post('container',                               [ContainerController::class, 'store']);
        Route::put('container/{container}',                    [ContainerController::class, 'update']);
        Route::delete('container/{container}',                 [ContainerController::class, 'destroy']);

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

        // Container — đăng ký, tra cứu và cập nhật hải quan
        Route::get('container',                            [ContainerCongController::class, 'index']);
        Route::get('container/lookup',                     [ContainerCongController::class, 'lookup']);
        Route::get('container/{container}',                [ContainerCongController::class, 'show']);
        Route::post('container',                           [ContainerCongController::class, 'store']);

        // Lịch tàu — chỉ xem (CongXuatNhapPage cần để lấy danh sách tàu đang cập cảng)
        Route::get('lich-tau', [NVLichTauController::class, 'index']);

        // Cổng xuất nhập
        Route::get('cong',  [NVLogCongController::class, 'index']);
        Route::post('cong', [NVLogCongController::class, 'store']);

        // Biên bản KTĐ
        Route::get('bien-ban-kt',  [NVBienBanKTController::class, 'index']);
        Route::post('bien-ban-kt', [NVBienBanKTController::class, 'store']);

        // Phiếu lấy hàng
        Route::get('phieu-lay-hang/scan-qr',                  [NVPhieuLayHangController::class, 'scanQR']);
        Route::get('phieu-lay-hang',                          [NVPhieuLayHangController::class, 'index']);
        Route::post('phieu-lay-hang',                         [NVPhieuLayHangController::class, 'store']);
        Route::get('phieu-lay-hang/{phieu}',                  [NVPhieuLayHangController::class, 'show']);
        Route::patch('phieu-lay-hang/{phieu}/xac-nhan',       [NVPhieuLayHangController::class, 'xacNhan']);
        Route::patch('phieu-lay-hang/{phieu}/vao-cong',       [NVPhieuLayHangController::class, 'vaoCong']);
        Route::patch('phieu-lay-hang/{phieu}/huy',            [NVPhieuLayHangController::class, 'huy']);

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

        // Container — xem
        Route::get('container',             [ContainerBaiController::class, 'index']);
        Route::get('container/{container}', [ContainerBaiController::class, 'show']);

        // Tally tiếp nhận container nhập từ tàu
        Route::get('tally/{machuyentau}',                        [ContainerBaiController::class, 'danhSachTally']);
        Route::patch('tally/{container}/xac-nhan',               [ContainerBaiController::class, 'xacNhan']);
        Route::patch('tally/{container}/tinh-trang',             [ContainerBaiController::class, 'capNhatTinhTrang']);

        // Sơ đồ bãi — toàn bộ tính năng
        Route::get('so-do-bai',                           [NVSoDoBaiController::class, 'index']);
        Route::get('so-do-bai/cho-gan-vitri',             [NVSoDoBaiController::class, 'choGanViTri']);
        Route::get('so-do-bai/goi-y-vitri/{container}',   [NVSoDoBaiController::class, 'goiYViTri']);
        Route::get('so-do-bai/goi-y-daochuyen/{obai}',   [NVSoDoBaiController::class, 'goiYDaoChuyen']);
        Route::get('so-do-bai/{khuvucbai}',               [NVSoDoBaiController::class, 'show']);
        Route::post('so-do-bai/gan-vitri',                [NVSoDoBaiController::class, 'ganVitri']);
        Route::post('so-do-bai/daochuyen',                [NVSoDoBaiController::class, 'daoChuyen']);

        // Lịch tàu — xem + cập nhật trạng thái + xác nhận dỡ hàng
        Route::get('lich-tau',                                    [LichTauBaiController::class, 'index']);
        Route::patch('lich-tau/{chuyentau}/trang-thai',           [LichTauBaiController::class, 'chuyenTrangThai']);

        // Biên bản kiểm tra định kỳ
        Route::get('bien-ban-kt',  [NVBaiBienBanKTController::class, 'index']);
        Route::post('bien-ban-kt', [NVBaiBienBanKTController::class, 'store']);

        // Lookups dùng chung
        Route::get('hang-tau',       [HangTauController::class, 'index']);
        Route::get('khu-vuc-bai',    [KhuVucBaiController::class, 'index']);
        Route::get('loai-container', [LoaiContainerController::class, 'index']);
    });

    // ─── KHÁCH HÀNG ──────────────────────────────────────────────────────────
    Route::middleware('role:khachhang')->prefix('kh')->group(function () {

        // Dashboard
        Route::get('dashboard', [DashboardKHController::class, 'index']);

        // E-Booking
        Route::get('booking',                   [BookingKHController::class, 'index']);
        Route::post('booking',                  [BookingKHController::class, 'store']);
        Route::patch('booking/{container}/huy', [BookingKHController::class, 'huy']);
        Route::get('lich-tau',                  [BookingKHController::class, 'lichTau']);

        // Theo dõi container
        Route::get('container',             [ContainerKHController::class, 'index']);
        Route::get('container/{container}', [ContainerKHController::class, 'show']);

        // Phiếu lấy hàng
        Route::get('phieu-lay-hang',                      [PhieuLayHangKHController::class, 'index']);
        Route::post('phieu-lay-hang',                     [PhieuLayHangKHController::class, 'store']);
        Route::get('phieu-lay-hang/{phieu}',              [PhieuLayHangKHController::class, 'show']);
        Route::patch('phieu-lay-hang/{phieu}/huy',        [PhieuLayHangKHController::class, 'huy']);
        Route::get('container-trong-bai',                 [PhieuLayHangKHController::class, 'containerTrongBai']);

        // Tài xế
        Route::get('tai-xe',                             [TaiXeKHController::class, 'index']);
        Route::post('tai-xe',                            [TaiXeKHController::class, 'store']);
        Route::patch('tai-xe/{taixe}',                   [TaiXeKHController::class, 'update']);
        Route::patch('tai-xe/{taixe}/mat-khau',          [TaiXeKHController::class, 'doiMatKhau']);
        Route::delete('tai-xe/{taixe}',                  [TaiXeKHController::class, 'destroy']);

        // Lookups
        Route::get('loai-container', [LoaiContainerController::class, 'index']);
    });

    // ─── TÀI XẾ ──────────────────────────────────────────────────────────────
    Route::middleware('role:taixe')->prefix('tx')->group(function () {
        Route::get('phieu-lay-hang',                          [PhieuLayHangTXController::class, 'index']);
        Route::get('phieu-lay-hang/{phieu}',                  [PhieuLayHangTXController::class, 'show']);
        Route::patch('phieu-lay-hang/{phieu}/den-cang',       [PhieuLayHangTXController::class, 'denCang']);
    });
});
