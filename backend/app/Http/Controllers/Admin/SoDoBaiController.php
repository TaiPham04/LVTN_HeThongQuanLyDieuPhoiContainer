<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Exceptions\GanViTriException;
use App\Models\Container;
use App\Models\KhuVucBai;
use App\Models\LichSuViTri;
use App\Models\OBai;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SoDoBaiController extends Controller
{
    // ─── GET /api/admin/so-do-bai ─────────────────────────────────
    public function index(): JsonResponse
    {
        $blocks = KhuVucBai::hoatDong()
            ->orderBy('tenblock')
            ->get(['makhuvuc', 'tenblock', 'sokhoang', 'sohang', 'sotang', 'loai_nhom', 'loai_hinh_uutien']);

        return response()->json(['data' => $blocks]);
    }

    // ─── GET /api/admin/so-do-bai/{khuvucbai} ─────────────────────
    public function show(KhuVucBai $khuvucbai): JsonResponse
    {
        $obaiList = $khuvucbai->obai()
            ->with(['vitriHienTai.container' => function ($q) {
                $q->select('macontainer', 'socontainer', 'bi_hong', 'trangthai_haiquan', 'da_thong_quan', 'thoigian_vaobai', 'machuyentau', 'loai_hinh')
                  ->with(['chuyentau' => function ($q2) {
                      $q2->select('machuyentau', 'mahangtau', 'sovoyage', 'tentau', 'thoigiandukien', 'thoigianroiben')
                         ->with(['hangtau:mahangtau,tenhangtau,mascac']);
                  }]);
            }])
            ->orderBy('tang')
            ->orderBy('hang')
            ->orderBy('khoang')
            ->get()
            ->map(fn ($o) => [
                'maobai'      => $o->maobai,
                'maobai_code' => $o->maobai_code,
                'khoang'      => $o->khoang,
                'hang'        => $o->hang,
                'tang'        => $o->tang,
                'trangthai'   => $o->trangthai,
                'container'   => $o->vitriHienTai?->container ? [
                    'socontainer'       => $o->vitriHienTai->container->socontainer,
                    'bi_hong'           => (bool) $o->vitriHienTai->container->bi_hong,
                    'trangthai_haiquan' => $o->vitriHienTai->container->trangthai_haiquan,
                    'da_thong_quan'     => (bool) $o->vitriHienTai->container->da_thong_quan,
                    'thoigian_vaobai'   => $o->vitriHienTai->container->thoigian_vaobai?->format('d/m/Y H:i'),
                    'loai_hinh'         => $o->vitriHienTai->container->loai_hinh,
                    'chuyentau'         => $o->vitriHienTai->container->chuyentau ? [
                        'sovoyage'       => $o->vitriHienTai->container->chuyentau->sovoyage,
                        'tentau'         => $o->vitriHienTai->container->chuyentau->tentau,
                        'tenhangtau'     => $o->vitriHienTai->container->chuyentau->hangtau?->tenhangtau,
                        'mascac'         => $o->vitriHienTai->container->chuyentau->hangtau?->mascac,
                        'thoigiandukien' => $o->vitriHienTai->container->chuyentau->thoigiandukien?->format('d/m/Y H:i'),
                        'thoigianroiben' => $o->vitriHienTai->container->chuyentau->thoigianroiben?->format('d/m/Y H:i'),
                    ] : null,
                ] : null,
            ]);

        return response()->json([
            'block' => [
                'makhuvuc'     => $khuvucbai->makhuvuc,
                'tenblock'     => $khuvucbai->tenblock,
                'sokhoang'     => $khuvucbai->sokhoang,
                'sohang'       => $khuvucbai->sohang,
                'sotang'       => $khuvucbai->sotang,
                'loai_nhom'    => $khuvucbai->loai_nhom,
                'loai_hinh_uutien' => $khuvucbai->loai_hinh_uutien,
            ],
            'obai' => $obaiList,
        ]);
    }

    // ─── GET /api/admin/so-do-bai/cho-gan-vitri ───────────────────
    // Containers trongbai chưa được gán ô nào
    public function choGanViTri(): JsonResponse
    {
        $assigned = LichSuViTri::whereNull('thoigian_roi')->pluck('macontainer')->toArray();

        // Danh sách block đang hoạt động — dùng để suy ra block phù hợp cho từng
        // container theo cả nhóm loại container LẪN luồng nhập/xuất.
        $blocks = KhuVucBai::hoatDong()->get(['tenblock', 'loai_nhom', 'loai_hinh_uutien']);

        $containers = Container::where('trangthai', 'trongbai')
            ->whereNotIn('macontainer', $assigned)
            ->with(['chuyentau.hangtau', 'loaicontainer'])
            ->orderBy('thoigian_vaobai')
            ->get()
            ->map(function ($c) use ($blocks) {
                $nhom = $c->loaicontainer?->nhom;
                $blockPhuHop = $blocks
                    ->filter(fn ($b) => $b->loai_nhom === $nhom && $b->loai_hinh_uutien === $c->loai_hinh)
                    ->pluck('tenblock')->sort()->implode(', ');

                return [
                    'macontainer'      => $c->macontainer,
                    'socontainer'      => $c->socontainer,
                    'mascac'           => $c->chuyentau?->hangtau?->mascac,
                    'tenhangtau'       => $c->chuyentau?->hangtau?->tenhangtau,
                    'sovoyage'         => $c->chuyentau?->sovoyage,
                    'tentau'           => $c->chuyentau?->tentau,
                    'loai_hinh'        => $c->loai_hinh,
                    'thoigiandukien'   => $c->chuyentau?->thoigiandukien?->format('d/m/Y H:i'),
                    'thoigianroiben'   => $c->chuyentau?->thoigianroiben?->format('d/m/Y H:i'),
                    'thoigian_vaobai'  => $c->thoigian_vaobai?->format('d/m/Y H:i'),
                    'trangthai_haiquan'=> $c->trangthai_haiquan,
                    'bi_hong'          => (bool) $c->bi_hong,
                    'tenloai'          => $c->loaicontainer?->tenloai,
                    'nhom'             => $nhom,
                    'block_phuhop'     => $blockPhuHop ?: null,
                ];
            });

        return response()->json(['data' => $containers]);
    }

    // ─── GET /api/admin/so-do-bai/goi-y-vitri/{macontainer} ──────
    public function goiYViTri(Container $container): JsonResponse
    {
        return response()->json(['data' => $this->tinhGoiY($container)]);
    }

    // ─── POST /api/admin/so-do-bai/gan-vitri ──────────────────────
    public function ganVitri(Request $request): JsonResponse
    {
        $request->validate([
            'macontainer' => 'required|exists:container,macontainer',
            'maobai'      => 'required|exists:obai,maobai',
        ]);

        try {
            [$container, $obai] = DB::transaction(function () use ($request) {
                $obai = OBai::with('khuvucbai')->where('maobai', $request->maobai)
                    ->lockForUpdate()
                    ->firstOrFail();
                $container = Container::with('loaicontainer')->where('macontainer', $request->macontainer)
                    ->lockForUpdate()
                    ->firstOrFail();

                if ($obai->trangthai !== 'trong') {
                    throw new GanViTriException('Ô bãi này đã được sử dụng.');
                }
                if ($container->trangthai !== 'trongbai') {
                    throw new GanViTriException('Container không ở trạng thái trong bãi.');
                }
                if (LichSuViTri::where('macontainer', $container->macontainer)->whereNull('thoigian_roi')->exists()) {
                    throw new GanViTriException('Container đã được gán vị trí rồi.');
                }

                $loai = $container->loaicontainer;

                if ($loai?->nhom !== $obai->khuvucbai?->loai_nhom) {
                    throw new GanViTriException('Loại container này không phù hợp với khu vực bãi đã chọn.');
                }

                if (!$this->phuHopLuong($obai->khuvucbai, $container->loai_hinh)) {
                    throw new GanViTriException($this->thongBaoSaiLuong($obai->khuvucbai, $container->loai_hinh));
                }

                // Kiểm tra vật lý: tầng > 1 phải có container ở tầng bên dưới
                if ($obai->tang > 1) {
                    $obaiDuoi = OBai::where('makhuvuc', $obai->makhuvuc)
                        ->where('khoang', $obai->khoang)
                        ->where('hang', $obai->hang)
                        ->where('tang', $obai->tang - 1)
                        ->where('trangthai', 'dangsudung')
                        ->first();

                    if (!$obaiDuoi) {
                        throw new GanViTriException('Không thể đặt container vào ô này — tầng bên dưới chưa có container.');
                    }
                }

                LichSuViTri::create([
                    'macontainer'    => $container->macontainer,
                    'maobai'         => $obai->maobai,
                    'manhanvien'     => $request->user()->mataikhoan,
                    'kieudichchuyen' => 'bandau',
                    'thoigian_gan'   => now(),
                ]);
                $obai->update(['trangthai' => 'dangsudung']);

                return [$container, $obai];
            });
        } catch (GanViTriException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => "Đã gán {$container->socontainer} vào ô {$obai->maobai_code}.",
        ]);
    }

    // ─── GET /api/admin/so-do-bai/goi-y-daochuyen/{maobai} ───────
    public function goiYDaoChuyen(OBai $obai): JsonResponse
    {
        $lichSu = LichSuViTri::where('maobai', $obai->maobai)
            ->whereNull('thoigian_roi')
            ->with('container')
            ->first();

        //Nếu container của ng dùng đang thực hiện đảo chuyển đã bị ng khác thực hiên
        //thì hệ thống sẽ báo lỗi 
        if (!$lichSu) {
            return response()->json(['message' => 'Ô này không có container.'], 422);
        }

        if ($obai->coContTrenDau()) {
            return response()->json(['message' => 'Không thể đảo chuyển — có container đang xếp trên ô này.'], 422);
        }

        return response()->json([
            'data'      => $this->tinhGoiY($lichSu->container, excludeObai: $obai),
            'container' => [
                'socontainer' => $lichSu->container->socontainer,
                'maobai_cu'   => $obai->maobai,
                'maobai_code' => $obai->maobai_code,
            ],
        ]);
    }

    // ─── POST /api/admin/so-do-bai/daochuyen ─────────────────────
    public function daoChuyen(Request $request): JsonResponse
    {
        $request->validate([
            'maobai_cu'  => 'required|exists:obai,maobai',
            'maobai_moi' => 'required|exists:obai,maobai|different:maobai_cu',
        ]);

        try {
            [$obaiMoi, $socontainer] = DB::transaction(function () use ($request) {

                $obaiCu  = OBai::where('maobai', $request->maobai_cu)->lockForUpdate()->firstOrFail();
                $obaiMoi = OBai::where('maobai', $request->maobai_moi)->lockForUpdate()->firstOrFail();

                if ($obaiMoi->trangthai !== 'trong') {
                    throw new GanViTriException('Ô đích đã được sử dụng.');
                }

                if ($obaiCu->coContTrenDau()) {
                    throw new GanViTriException('Không thể đảo chuyển — có container đang xếp trên ô này.');
                }

                $lichSuCu = LichSuViTri::where('maobai', $obaiCu->maobai)
                    ->whereNull('thoigian_roi')
                    ->with(['container.loaicontainer'])
                    ->first();

                if (!$lichSuCu) {
                    throw new GanViTriException('Không tìm thấy container tại ô này.');
                }

                $loaiDich = $lichSuCu->container?->loaicontainer;
                $obaiMoi->loadMissing('khuvucbai');

                if ($loaiDich?->nhom !== $obaiMoi->khuvucbai?->loai_nhom) {
                    throw new GanViTriException('Loại container này không phù hợp với khu vực bãi đích.');
                }

                if (!$this->phuHopLuong($obaiMoi->khuvucbai, $lichSuCu->container->loai_hinh)) {
                    throw new GanViTriException($this->thongBaoSaiLuong($obaiMoi->khuvucbai, $lichSuCu->container->loai_hinh));
                }

                // Kiểm tra vật lý: tầng > 1 phải có container ở tầng bên dưới — ô hỗ trợ
                // không được CHÍNH LÀ ô nguồn đang đảo chuyển, vì ô đó sẽ trống ngay sau
                // bước này (không thể vừa làm chỗ đứng cho ô đích vừa tự dời đi khỏi đó).
                if ($obaiMoi->tang > 1) {
                    $obaiDuoi = OBai::where('makhuvuc', $obaiMoi->makhuvuc)
                        ->where('khoang', $obaiMoi->khoang)
                        ->where('hang', $obaiMoi->hang)
                        ->where('tang', $obaiMoi->tang - 1)
                        ->where('trangthai', 'dangsudung')
                        ->first();

                    if (!$obaiDuoi || $obaiDuoi->maobai === $obaiCu->maobai) {
                        throw new GanViTriException('Không thể đảo chuyển vào ô này — tầng bên dưới chưa có container.');
                    }
                }

                $lichSuCu->update(['thoigian_roi' => now()]);

                LichSuViTri::create([
                    'macontainer'    => $lichSuCu->macontainer,
                    'maobai'         => $obaiMoi->maobai,
                    'manhanvien'     => $request->user()->mataikhoan,
                    'kieudichchuyen' => 'daochuyen',
                    'thoigian_gan'   => now(),
                ]);

                $obaiCu->update(['trangthai' => 'trong']);
                $obaiMoi->update(['trangthai' => 'dangsudung']);

                return [$obaiMoi, $lichSuCu->container?->socontainer ?? ''];
            });
        } catch (GanViTriException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json([
            'message' => "Đã đảo chuyển {$socontainer} sang ô {$obaiMoi->maobai_code}.",
        ]);
    }

    // ─── Kiểm tra khu vực bãi có phù hợp luồng nhập/xuất của container không ──
    // Mỗi khu vực bãi chuyên biệt đúng 1 luồng — không có khái niệm "dùng chung".
    private function phuHopLuong(?KhuVucBai $khuvucbai, ?string $loaiHinh): bool
    {
        return $khuvucbai?->loai_hinh_uutien === $loaiHinh;
    }

    private function thongBaoSaiLuong(?KhuVucBai $khuvucbai, ?string $loaiHinh): string
    {
        $label = ['nhap' => 'Nhập', 'xuat' => 'Xuất'];
        $uutienLabel  = $label[$khuvucbai?->loai_hinh_uutien] ?? $khuvucbai?->loai_hinh_uutien;
        $loaiHinhLabel = $label[$loaiHinh] ?? $loaiHinh;

        return "Khu vực bãi {$khuvucbai?->tenblock} chỉ ưu tiên cho luồng {$uutienLabel}, không phù hợp với container luồng {$loaiHinhLabel}.";
    }


    // ─── Thuật toán gợi ý ô (dùng chung) ─────────────────────────
    // $excludeObai: ô hiện tại của container đang đảo chuyển (null nếu là gán vị trí lần đầu)
    private function tinhGoiY(Container $container, ?OBai $excludeObai = null): \Illuminate\Support\Collection
    {
        $container->loadMissing('loaicontainer');
        $loai = $container->loaicontainer;
        $nhom = $loai?->nhom;

        // Sắp xếp cố định (tầng → block → khoang → hàng) để khi nhiều ô đồng điểm,
        // thứ tự tie-break luôn xác định và tái lập được — không phụ thuộc thứ tự
        // vật lý ngẫu nhiên MySQL trả về.
        $query = OBai::where('trangthai', 'trong')
            ->with('khuvucbai')
            ->orderBy('tang') //Khóa sắp xếp chính
            ->orderBy('makhuvuc')
            ->orderBy('khoang')
            ->orderBy('hang');

        if ($excludeObai) $query->where('maobai', '!=', $excludeObai->maobai); //Điều kiện gợi ý là phải khác ô hiện tại

        //Hiển thị các ô đang được sử dụng
        $occupiedKeys = OBai::where('trangthai', 'dangsudung')
            ->get(['makhuvuc', 'khoang', 'hang', 'tang'])
            ->mapWithKeys(fn ($o) => ["{$o->makhuvuc}-{$o->khoang}-{$o->hang}-{$o->tang}" => true])
            ->all();

        // Ô nguồn của container đang đảo chuyển sẽ trống ngay sau khi di chuyển xong —
        // không được tính là "có container bên dưới" hỗ trợ cho bất kỳ ứng viên nào,
        // nếu không hệ thống sẽ gợi ý xếp container lên ngay trên đầu vị trí cũ của
        // chính nó, và ô cũ trống đi ngay sau đó tạo lại đúng tình trạng lơ lửng.
        if ($excludeObai) {
            unset($occupiedKeys["{$excludeObai->makhuvuc}-{$excludeObai->khoang}-{$excludeObai->hang}-{$excludeObai->tang}"]);
        }

        //Chọn ra ô ứng viên phù hợp
        $emptySlots = $query->get()->filter(function ($o) use ($nhom, $container, $occupiedKeys) {
            
            //Kiểm tra nhóm container có đúng với loại nhóm của khu vực bãi đó kh
            if ($o->khuvucbai?->loai_nhom !== $nhom) return false;

            //Kiểm tra loại hình container (xuất/nhập) có phù hợp với loại hình ưu tiên của khu vực đó kh
            if (!$this->phuHopLuong($o->khuvucbai, $container->loai_hinh)) return false;

            //Kiểm tra trường hợp tầng lớn hơn 1:
            if ($o->tang > 1) {

                //thì lấy vị trí ngay taij ô phía dưới của ô đó(cùng khu vực cùng khoang cùng hàng nhưng tầng dưới)
                $belowKey = "{$o->makhuvuc}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1);

                //Nếu kh tồn tại container phía dưới hay tầng dưới rỗng sẽ trả về false
                if (!isset($occupiedKeys[$belowKey])) return false;
            }
            return true;
        });

        //Nếu vị trí rỗng thì có thể đặt được
        if ($emptySlots->isEmpty()) {
            return collect(); //Trả về collection rỗng nếu kh có ô nào hợp lệ
        }

        $occupied = DB::table('lichsuvitri')
            ->join('obai',      'lichsuvitri.maobai',      '=', 'obai.maobai')
            ->join('container', 'lichsuvitri.macontainer', '=', 'container.macontainer')
            ->join('chuyentau', 'container.machuyentau',   '=', 'chuyentau.machuyentau')

            //Lấy các container còn nằm trong bãi
            ->whereNull('lichsuvitri.thoigian_roi')
            ->select(
                'obai.makhuvuc', 'obai.khoang', 'obai.hang', 'obai.tang',
                'container.machuyentau', 'chuyentau.thoigianroiben',
                'container.so_vandon', 'container.thoigian_vaobai'
            )
            ->get();

        $blockChuyen     = [];
        $blockLoad       = [];
        $roiBenTheoViTri = []; // "{block}-{khoang}-{hàng}-{tầng}" => ngày rời bến của container đang ở đúng ô đó
        $chuyenTheoViTri = []; // "{block}-{khoang}-{hàng}-{tầng}" => machuyentau của container đang ở đúng ô đó
        $blockVanDon     = []; // Block có chứa vận đơn x không — nền cho gom nhóm hàng NHẬP
        $vanDonTheoViTri = []; // "{block}-{khoang}-{hàng}-{tầng}" => so_vandon của container đang ở đúng ô đó
        $vaoBaiTheoViTri = []; // "{block}-{khoang}-{hàng}-{tầng}" => thoigian_vaobai của container đang ở đúng ô đó

        foreach ($occupied as $r) {

            //Block có chứa chuyến tàu x kh
            $blockChuyen[$r->makhuvuc][$r->machuyentau] = true;

            //Đếm số container nếu có chứa 1 or 2 thì +1
            $blockLoad[$r->makhuvuc] = ($blockLoad[$r->makhuvuc] ?? 0) + 1;

            // Ghi nhận ngày rời bến theo đúng vị trí vật lý — dùng để so sánh thứ tự
            // xếp chồng (LIFO) ở diemGoiYXuat().
            $roiBenTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->thoigianroiben;

            // Ghi nhận chuyến tàu theo đúng vị trí vật lý — dùng để ưu tiên xây cao
            // cùng 1 cột theo đúng 1 chuyến, và mở rộng liền kề khi cột đã đầy.
            $chuyenTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->machuyentau;

            if (!empty($r->so_vandon)) {
                $blockVanDon[$r->makhuvuc][$r->so_vandon] = true;
                $vanDonTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->so_vandon;
            }

            $vaoBaiTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->thoigian_vaobai;
        }


        //Đếm tổng số ô của các block loại các ô không hoạt động
        $totalPerBlock = OBai::whereNot('trangthai', 'khonghoatdong')
            ->groupBy('makhuvuc')
            ->select('makhuvuc', DB::raw('COUNT(*) as total'))
            ->pluck('total', 'makhuvuc');

        //Trả về 3 vị trí phù hợp nhất
        return $emptySlots->map(function ($o) use ($container, $blockChuyen, $blockLoad, $totalPerBlock, $roiBenTheoViTri, $chuyenTheoViTri, $blockVanDon, $vanDonTheoViTri, $vaoBaiTheoViTri) {
            $kv = $o->makhuvuc;
            $total = $totalPerBlock[$kv] ?? 1;
            $tyLeDayBlock = ($blockLoad[$kv] ?? 0) / $total;

            $score = $container->loai_hinh === 'xuat'
                ? $this->diemGoiYXuat($container, $o, $kv, $blockChuyen, $tyLeDayBlock, $roiBenTheoViTri, $chuyenTheoViTri)
                : $this->diemGoiYNhap($container, $o, $kv, $blockVanDon, $tyLeDayBlock, $vaoBaiTheoViTri, $vanDonTheoViTri);

            return [
                'maobai'      => $o->maobai,
                'maobai_code' => $o->maobai_code,
                'makhuvuc'    => $o->makhuvuc,
                'tenblock'    => $o->khuvucbai->tenblock,
                'tang'        => $o->tang,
                'hang'        => $o->hang,
                'khoang'      => $o->khoang,
                'score'       => $score,
            ];
        })
        ->sortByDesc('score')
        ->take(3)
        ->values();
    }

    // Điểm gợi ý cho container XUẤT — ưu tiên gom theo chuyến tàu để dễ
    // bốc lên tàu, càng gần ngày tàu rời bến càng cần đặt thấp để lấy nhanh
    private function diemGoiYXuat(Container $container, OBai $o, int $kv, array $blockChuyen, float $tyLeDayBlock, array $roiBenTheoViTri, array $chuyenTheoViTri): int
    {
        $score = 0;
        $sotang = $o->khuvucbai->sotang;

        //Nếu trong block hiện tại đã tồn tại ít nhất một container cùng chuyến tàu với container đang xét score + 15
        if (!empty($blockChuyen[$kv][$container->machuyentau])) {
            $score += 15;
        }

        if ($o->tang > 1) {
            $chuyenBenDuoi = $chuyenTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;

            if ($chuyenBenDuoi !== null && (int) $chuyenBenDuoi === (int) $container->machuyentau) {
                $score += 20 + $o->tang * 10;
            } else {
                $score -= 20;

                $roiBenBenDuoi = $roiBenTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;
                $roiBenCuaMinh = $container->chuyentau?->thoigianroiben;

                if ($roiBenBenDuoi && $roiBenCuaMinh) {
                    if ($roiBenCuaMinh->lessThanOrEqualTo(\Carbon\Carbon::parse($roiBenBenDuoi))) {
                        $score += 15; // đúng thứ tự: cont mới rời sớm hơn/bằng cont bên dưới
                    } else {
                        $score -= 30; // sai thứ tự: sẽ chặn đường lấy cont bên dưới
                    }
                }
            }
        } else { //Trường hợp mở cột mới 
            $lienKe = [
                [$o->khoang - 1, $o->hang],
                [$o->khoang + 1, $o->hang],
                [$o->khoang, $o->hang - 1],
                [$o->khoang, $o->hang + 1],
            ];
            foreach ($lienKe as [$k, $h]) {
                $chuyenODinhCot = $chuyenTheoViTri["{$kv}-{$k}-{$h}-{$sotang}"] ?? null;
                if ($chuyenODinhCot !== null && (int) $chuyenODinhCot === (int) $container->machuyentau) {
                    $score += 25;
                    break;
                }
            }
        }

        //Phạt tầng
        $tyLeTang = $sotang > 1 ? ($o->tang - 1) / ($sotang - 1) : 0.0;
        $score -= (int) round($tyLeTang * 24);

        $soNgayConLai = $container->chuyentau?->thoiGianDongHaBai()
            ? now()->diffInDays($container->chuyentau->thoiGianDongHaBai(), false)
            : null;

        //Nếu đã lên lịch tức là có số ngày còn lại và số ngày đó >=0
        if ($soNgayConLai !== null && $soNgayConLai >= 0) {
            
            //Ở đây ta dùng hệ quy chiếu là Xe tải gắp cont
            $heSoTang = 5 * (1 - $tyLeTang);

            //Bonus khẩn cấp theo số ngày còn lại
            $score += (int) round(max(0, 4 - $soNgayConLai) * $heSoTang);
        }

        // Ưu tiên block ít hàng hơn: -tối đa 15 điểm
        $score -= (int) round($tyLeDayBlock * 15);

        return $score;
    }

    private function diemGoiYNhap(Container $container, OBai $o, int $kv, array $blockVanDon, float $tyLeDayBlock, array $vaoBaiTheoViTri, array $vanDonTheoViTri): int
    {
        $score = 0;
        $sotang = $o->khuvucbai->sotang;

        if (!empty($container->so_vandon) && !empty($blockVanDon[$kv][$container->so_vandon])) {
            $score += 15;
        }

        if ($o->tang > 1) {
            $vanDonBenDuoi = $vanDonTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;

            if (!empty($container->so_vandon) && $vanDonBenDuoi !== null && $vanDonBenDuoi === $container->so_vandon) {
                
                $score += 20 + $o->tang * 10;
                
            } else {
                // Buộc phải chồng lên container KHÁC vận đơn  — phạt nhẹ, không nặng bằng "trộn chuyến" ở hàng xuất
                // vì hàng nhập vốn không bị áp lực thời hạn tàu chạy như nhau.
                $score -= 10;

                $vaoBaiBenDuoi = $vaoBaiTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;

                if ($vaoBaiBenDuoi && $container->thoigian_vaobai) {
                    if ($container->thoigian_vaobai->lessThanOrEqualTo(\Carbon\Carbon::parse($vaoBaiBenDuoi))) {
                        $score += 10; // đúng thứ tự: cont mới vào sớm hơn/bằng cont bên dưới
                    } else {
                        $score -= 15; // sai thứ tự: sẽ chặn đường lấy cont bên dưới (vào trước, cần lấy trước)
                    }
                }
            }
        } else {
            //Mở cột mới
            if (!empty($container->so_vandon)) {
                $lienKe = [
                    [$o->khoang - 1, $o->hang],
                    [$o->khoang + 1, $o->hang],
                    [$o->khoang, $o->hang - 1],
                    [$o->khoang, $o->hang + 1],
                ];
                foreach ($lienKe as [$k, $h]) {
                    $vanDonODinhCot = $vanDonTheoViTri["{$kv}-{$k}-{$h}-{$sotang}"] ?? null;
                    if ($vanDonODinhCot !== null && $vanDonODinhCot === $container->so_vandon) {
                        $score += 25;
                        break;
                    }
                }
            }
        }

        
        $tyLeTang = $sotang > 1 ? ($o->tang - 1) / ($sotang - 1) : 0.0;
        $score -= (int) round($tyLeTang * 30);

        // Đã thông quan (có thể lấy ngay): thưởng thêm cho vị trí càng thấp càng tốt
        // — dùng công thức MƯỢT theo tyLeTang
        if ($container->da_thong_quan) {
            $score += (int) round((1 - $tyLeTang) * 15);
        }

        // Ưu tiên block ít hàng hơn: -tối đa 20 điểm
        $score -= (int) round($tyLeDayBlock * 20);

        return $score;
    }
}
