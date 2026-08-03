<?php

namespace App\Http\Controllers\NhanVien\Bai;

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
    // ─── GET /api/nv/bai/so-do-bai ───────────────────────────────
    public function index(): JsonResponse
    {
        $blocks = KhuVucBai::hoatDong()
            ->orderBy('tenblock')
            ->get(['makhuvuc', 'tenblock', 'sokhoang', 'sohang', 'sotang', 'loai_nhom', 'loai_hinh_uutien']);

        return response()->json(['data' => $blocks]);
    }

    // ─── GET /api/nv/bai/so-do-bai/{khuvucbai} ───────────────────
    public function show(KhuVucBai $khuvucbai): JsonResponse
    {
        $obaiList = $khuvucbai->obai()
            ->with(['vitriHienTai.container' => function ($q) {
                $q->select('macontainer', 'socontainer', 'bi_hong', 'trangthai_haiquan', 'da_thong_quan', 'thoigian_vaobai');
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

    // ─── GET /api/nv/bai/so-do-bai/cho-gan-vitri ─────────────────
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
                    'macontainer'     => $c->macontainer,
                    'socontainer'     => $c->socontainer,
                    'mascac'          => $c->chuyentau?->hangtau?->mascac,
                    'sovoyage'        => $c->chuyentau?->sovoyage,
                    'thoigian_vaobai' => $c->thoigian_vaobai?->format('d/m/Y H:i'),
                    'nhom'            => $nhom,
                    'block_phuhop'    => $blockPhuHop ?: null,
                ];
            });

        return response()->json(['data' => $containers]);
    }

    // ─── GET /api/nv/bai/so-do-bai/goi-y-vitri/{container} ──────
    public function goiYViTri(Container $container): JsonResponse
    {
        return response()->json(['data' => $this->tinhGoiY($container)]);
    }

    // ─── POST /api/nv/bai/so-do-bai/gan-vitri ────────────────────
    public function ganVitri(Request $request): JsonResponse
    {
        $request->validate([
            'macontainer' => 'required|exists:container,macontainer',
            'maobai'      => 'required|exists:obai,maobai',
        ]);

        try {
            [$container, $obai] = DB::transaction(function () use ($request) {
                // Khóa cả 2 bản ghi trước khi kiểm tra — tránh 2 request đồng thời
                // cùng đọc "còn trống" rồi cùng gán vào 1 ô / cùng 1 container.
                $obai      = OBai::with('khuvucbai')->where('maobai', $request->maobai)->lockForUpdate()->firstOrFail();
                $container = Container::with('loaicontainer')->where('macontainer', $request->macontainer)->lockForUpdate()->firstOrFail();

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

    // ─── GET /api/nv/bai/so-do-bai/goi-y-daochuyen/{obai} ───────
    public function goiYDaoChuyen(OBai $obai): JsonResponse
    {
        $lichSu = LichSuViTri::where('maobai', $obai->maobai)
            ->whereNull('thoigian_roi')
            ->with('container')
            ->first();

        if (!$lichSu) {
            return response()->json(['message' => 'Ô này không có container.'], 422);
        }

        if ($this->coContTrenDau($obai)) {
            return response()->json(['message' => 'Không thể đảo chuyển — có container đang xếp trên ô này.'], 422);
        }

        return response()->json([
            'data'      => $this->tinhGoiY($lichSu->container, excludeObai: $obai->maobai, maxTang: $obai->tang),
            'container' => [
                'socontainer' => $lichSu->container->socontainer,
                'maobai_cu'   => $obai->maobai,
                'maobai_code' => $obai->maobai_code,
            ],
        ]);
    }

    // ─── POST /api/nv/bai/so-do-bai/daochuyen ────────────────────
    public function daoChuyen(Request $request): JsonResponse
    {
        $request->validate([
            'maobai_cu'  => 'required|exists:obai,maobai',
            'maobai_moi' => 'required|exists:obai,maobai|different:maobai_cu',
        ]);

        try {
            [$obaiMoi, $socontainer] = DB::transaction(function () use ($request) {
                // Khóa cả 2 ô trước khi kiểm tra — tránh 2 request đồng thời cùng
                // đảo chuyển vào ô đích, hoặc đảo cùng lúc từ 1 ô nguồn.
                $obaiCu  = OBai::where('maobai', $request->maobai_cu)->lockForUpdate()->firstOrFail();
                $obaiMoi = OBai::where('maobai', $request->maobai_moi)->lockForUpdate()->firstOrFail();

                if ($obaiMoi->trangthai !== 'trong') {
                    throw new GanViTriException('Ô đích đã được sử dụng.');
                }

                if ($this->coContTrenDau($obaiCu)) {
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

                // Kiểm tra vật lý: tầng > 1 phải có container ở tầng bên dưới
                if ($obaiMoi->tang > 1) {
                    $obaiDuoi = OBai::where('makhuvuc', $obaiMoi->makhuvuc)
                        ->where('khoang', $obaiMoi->khoang)
                        ->where('hang', $obaiMoi->hang)
                        ->where('tang', $obaiMoi->tang - 1)
                        ->where('trangthai', 'dangsudung')
                        ->first();

                    if (!$obaiDuoi) {
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

    // ─── Helpers ─────────────────────────────────────────────────

    // Kiểm tra khu vực bãi có phù hợp luồng nhập/xuất của container không —
    // mỗi khu vực bãi chuyên biệt đúng 1 luồng, không có khái niệm "dùng chung".
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

    private function coContTrenDau(OBai $obai): bool
    {
        return OBai::where('makhuvuc', $obai->makhuvuc)
            ->where('khoang',    $obai->khoang)
            ->where('hang',      $obai->hang)
            ->where('tang',      $obai->tang + 1)
            ->where('trangthai', 'dangsudung')
            ->exists();
    }

    private function tinhGoiY(Container $container, ?int $excludeObai = null, ?int $maxTang = null): \Illuminate\Support\Collection
    {
        $container->loadMissing('loaicontainer');
        $loai = $container->loaicontainer;
        $nhom = $loai?->nhom;

        // Sắp xếp cố định (tầng → block → khoang → hàng) để khi nhiều ô đồng điểm,
        // thứ tự tie-break luôn xác định và tái lập được — không phụ thuộc thứ tự
        // vật lý ngẫu nhiên MySQL trả về.
        $query = OBai::where('trangthai', 'trong')->with('khuvucbai')
            ->orderBy('tang')->orderBy('makhuvuc')->orderBy('khoang')->orderBy('hang');
        if ($excludeObai) $query->where('maobai', '!=', $excludeObai);
        if ($maxTang !== null) $query->where('tang', '<=', $maxTang);

        $occupiedKeys = OBai::where('trangthai', 'dangsudung')
            ->get(['makhuvuc', 'khoang', 'hang', 'tang'])
            ->mapWithKeys(fn ($o) => ["{$o->makhuvuc}-{$o->khoang}-{$o->hang}-{$o->tang}" => true])
            ->all();

        $emptySlots = $query->get()->filter(function ($o) use ($nhom, $container, $occupiedKeys) {
            if ($o->khuvucbai?->loai_nhom !== $nhom) return false;
            if (!$this->phuHopLuong($o->khuvucbai, $container->loai_hinh)) return false;
            if ($o->tang > 1) {
                $belowKey = "{$o->makhuvuc}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1);
                if (!isset($occupiedKeys[$belowKey])) return false;
            }
            return true;
        });

        if ($emptySlots->isEmpty()) return collect();

        // KHÔNG còn thống kê theo hãng tàu — tiêu chí "cùng hãng tàu" đã bị loại bỏ
        // (xem diemGoiYXuat): 2 container cùng hãng nhưng khác chuyến/khác ngày rời
        // bến có lịch bốc dỡ độc lập, gom chung không giảm được đảo chuyển thực tế.
        $occupied = DB::table('lichsuvitri')
            ->join('obai',      'lichsuvitri.maobai',      '=', 'obai.maobai')
            ->join('container', 'lichsuvitri.macontainer', '=', 'container.macontainer')
            ->join('chuyentau', 'container.machuyentau',   '=', 'chuyentau.machuyentau')
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
            $blockChuyen[$r->makhuvuc][$r->machuyentau] = true;
            $blockLoad[$r->makhuvuc] = ($blockLoad[$r->makhuvuc] ?? 0) + 1;
            $roiBenTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->thoigianroiben;
            $chuyenTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->machuyentau;

            // Gom nhóm hàng NHẬP theo so_vandon (biết từ lúc Import Manifest — có
            // sớm hơn hẳn makhachhang, vốn chỉ được điền SAU KHI khách tự "nhận
            // theo vận đơn", thường là sau lúc gán vị trí rất lâu).
            if (!empty($r->so_vandon)) {
                $blockVanDon[$r->makhuvuc][$r->so_vandon] = true;
                $vanDonTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->so_vandon;
            }

            // Ghi nhận thời điểm vào bãi theo đúng vị trí vật lý — dùng làm proxy
            // cho "hạn lấy hàng" khi buộc phải chồng khác vận đơn ở diemGoiYNhap().
            $vaoBaiTheoViTri["{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang}"] = $r->thoigian_vaobai;
        }

        $totalPerBlock = OBai::whereNot('trangthai', 'khonghoatdong')
            ->groupBy('makhuvuc')
            ->select('makhuvuc', DB::raw('COUNT(*) as total'))
            ->pluck('total', 'makhuvuc');

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

    // ─── Điểm gợi ý cho container XUẤT — ưu tiên gom theo chuyến tàu để dễ
    // bốc lên tàu, càng gần ngày tàu rời bến càng cần đặt thấp để lấy nhanh ───
    private function diemGoiYXuat(Container $container, OBai $o, int $kv, array $blockChuyen, float $tyLeDayBlock, array $roiBenTheoViTri, array $chuyenTheoViTri): int
    {
        $score = 0;
        $sotang = $o->khuvucbai->sotang;

        // Tín hiệu NỀN: có container cùng chuyến tàu ở đâu đó trong block này không
        // (bất kể vị trí cụ thể) — trọng số nhỏ, chỉ để phá thế hòa khi các tiêu chí
        // vị trí cụ thể bên dưới (Tier 1/1b) không phân định được.
        if (!empty($blockChuyen[$kv][$container->machuyentau])) {
            $score += 15;
        }

        if ($o->tang > 1) {
            $chuyenBenDuoi = $chuyenTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;

            if ($chuyenBenDuoi !== null && (int) $chuyenBenDuoi === (int) $container->machuyentau) {
                // TIER 1 — ƯU TIÊN TUYỆT ĐỐI: đúng chuyến tàu đang nằm ngay bên dưới.
                // Càng lên cao càng cộng NHIỀU điểm hơn — khuyến khích xây ĐẦY 1 cột
                // theo đúng 1 chuyến trước khi mở cột khác, tránh 1 cột lẫn nhiều chuyến.
                $score += 20 + $o->tang * 10;
            } else {
                // Buộc phải chồng lên 1 chuyến KHÁC — phạt cơ bản vì trộn chuyến.
                $score -= 20;

                // TIER 2 — PHỤ: chỉ xét đúng/sai thứ tự ngày rời bến (LIFO) khi đã
                // buộc phải trộn chuyến, trọng số nhỏ hơn hẳn Tier 1.
                $roiBenBenDuoi = $roiBenTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;
                $roiBenCuaMinh = $container->chuyentau?->thoigianroiben;

                if ($roiBenBenDuoi && $roiBenCuaMinh) {
                    if ($roiBenCuaMinh->lessThanOrEqualTo(\Carbon\Carbon::parse($roiBenBenDuoi))) {
                        $score += 15;
                    } else {
                        $score -= 30;
                    }
                }
            }
        } else {
            // TIER 1b — Tầng 1 (mở cột mới): thưởng nếu liền kề (4 hướng khoang/hàng)
            // 1 cột ĐÃ ĐẦY (chạm sotang) của ĐÚNG chuyến tàu này — mở rộng ngay xung
            // quanh thay vì rải rác khắp block.
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

        // Vị trí tương đối trong ngăn xếp — CHUẨN HÓA theo sotang thực tế của TỪNG
        // block, thay vì dùng số tầng tuyệt đối: 0 = đáy/mở cột mới (không đè lên ai),
        // 1 = đỉnh cao nhất được phép của block đó. Block chỉ có 1 tầng (hazmat) thì
        // không có khái niệm "cao/thấp", tỉ lệ luôn = 0. Vẫn là tiêu chí PHỤ, thường
        // bị lấn át bởi tín hiệu "xây cao cùng chuyến" ở Tier 1.
        $tyLeTang = $sotang > 1 ? ($o->tang - 1) / ($sotang - 1) : 0.0;

        // Phạt theo vị trí tương đối: càng gần đỉnh cho phép của block càng bị trừ
        // nhiều (đang chồng lên nhiều container hơn) — tối đa 24 điểm ở đỉnh.
        $score -= (int) round($tyLeTang * 24);

        // Càng gần giờ đóng hạ bãi (cut-off — mốc cảng lập kế hoạch xếp dỡ, không phải
        // ETD) càng cần đặt thấp để lấy nhanh, tránh đảo chuyển gấp. Dùng hàm giảm dần
        // TUYẾN TÍNH theo số ngày còn lại (không phải bậc thang) để tránh 2 container
        // lệch nhau 1 ngày quanh 1 mốc cứng bị chấm điểm lệch hẳn.
        $soNgayConLai = $container->chuyentau?->thoiGianDongHaBai()
            ? now()->diffInDays($container->chuyentau->thoiGianDongHaBai(), false)
            : null;

        if ($soNgayConLai !== null && $soNgayConLai >= 0) {
            // Hệ số theo vị trí tương đối: đáy hưởng lợi tối đa (5), đỉnh cho phép hết
            // tác dụng (0) — giảm dần MƯỢT, tự thích ứng theo sotang của từng block.
            $heSoTang = 5 * (1 - $tyLeTang);
            // Còn 0 ngày -> hệ số khẩn cấp 4; còn ≥4 ngày -> hết khẩn cấp (bonus = 0).
            $score += (int) round(max(0, 4 - $soNgayConLai) * $heSoTang);
        }

        // Ưu tiên block ít hàng hơn: -tối đa 15 điểm
        $score -= (int) round($tyLeDayBlock * 15);

        return $score;
    }

    // ─── Điểm gợi ý cho container NHẬP — tiêu chí CHÍNH vẫn là đặt thấp để khách
    // lấy hàng thuận tiện bất cứ lúc nào (không phụ thuộc lịch tàu), nhưng ưu tiên
    // TUYỆT ĐỐI gom các container CÙNG VẬN ĐƠN (cùng lô hàng) vào chung 1 cột hoặc
    // liền kề — khách thường lấy cả lô 1 lần, gom chung giúp giảm hẳn số lượt đảo
    // chuyển và tài xế không phải chạy lòng vòng nhiều khu vực trong bãi ────────
    private function diemGoiYNhap(Container $container, OBai $o, int $kv, array $blockVanDon, float $tyLeDayBlock, array $vaoBaiTheoViTri, array $vanDonTheoViTri): int
    {
        $score = 0;
        $sotang = $o->khuvucbai->sotang;

        // Tín hiệu NỀN: có container cùng vận đơn ở đâu đó trong block này không
        // (bất kể vị trí cụ thể) — trọng số nhỏ, chỉ để phá thế hòa.
        if (!empty($container->so_vandon) && !empty($blockVanDon[$kv][$container->so_vandon])) {
            $score += 15;
        }

        if ($o->tang > 1) {
            $vanDonBenDuoi = $vanDonTheoViTri["{$kv}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1)] ?? null;

            if (!empty($container->so_vandon) && $vanDonBenDuoi !== null && $vanDonBenDuoi === $container->so_vandon) {
                // TIER 1 — ƯU TIÊN TUYỆT ĐỐI: đúng vận đơn đang nằm ngay bên dưới.
                // Càng lên cao càng cộng nhiều điểm hơn — khuyến khích xây ĐẦY 1 cột
                // cho cùng 1 lô hàng trước khi mở cột khác, để khách lấy cả lô 1 lần
                // mà không phải chạy nhiều vị trí rải rác trong bãi.
                $score += 20 + $o->tang * 10;
            } else {
                // Buộc phải chồng lên container KHÁC vận đơn (hoặc container này chưa
                // có so_vandon) — phạt nhẹ, không nặng bằng "trộn chuyến" ở hàng xuất
                // vì hàng nhập vốn không bị áp lực thời hạn tàu chạy như nhau.
                $score -= 10;

                // TIER 2 — PHỤ: khi đã buộc phải trộn lô hàng, vẫn cần tránh chặn
                // đường lấy hàng — container vào bãi CÀNG SỚM thì càng gần hết free
                // time, càng cần lấy ra trước, nên nên nằm ở tầng CAO HƠN (LIFO theo
                // thời điểm vào bãi — cùng nguyên lý với "ngày rời bến" ở hàng xuất).
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
            // TIER 1b — Tầng 1 (mở cột mới): thưởng nếu liền kề (4 hướng khoang/hàng)
            // 1 cột ĐÃ ĐẦY (chạm sotang) của ĐÚNG vận đơn này — mở rộng ngay xung
            // quanh thay vì rải rác khắp block.
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

        // Vị trí tương đối trong ngăn xếp — CHUẨN HÓA theo sotang thực tế của block,
        // cùng nguyên lý ở diemGoiYXuat. Trọng số CAO HƠN xuất (30 so với 24) vì "đặt
        // thấp" vẫn là tiêu chí CHÍNH của nhập (không phải phụ như ở xuất) — khách có
        // thể đến lấy bất cứ lúc nào, không có lịch tàu cố định để bám vào.
        $tyLeTang = $sotang > 1 ? ($o->tang - 1) / ($sotang - 1) : 0.0;
        $score -= (int) round($tyLeTang * 30);

        // Đã thông quan (có thể lấy ngay): thưởng thêm cho vị trí càng thấp càng tốt
        // — dùng công thức MƯỢT theo tyLeTang thay vì bậc thang cứng "tầng 1/2/khác"
        // cũ, đồng nhất phong cách với diemGoiYXuat.
        if ($container->da_thong_quan) {
            $score += (int) round((1 - $tyLeTang) * 15);
        }

        // Ưu tiên block ít hàng hơn: -tối đa 20 điểm
        $score -= (int) round($tyLeDayBlock * 20);

        return $score;
    }
}
