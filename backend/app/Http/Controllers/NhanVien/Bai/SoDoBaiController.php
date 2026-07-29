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
            ->get(['makhuvuc', 'tenblock', 'sokhoang', 'sohang', 'sotang', 'loai_nhom']);

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
            ],
            'obai' => $obaiList,
        ]);
    }

    // ─── GET /api/nv/bai/so-do-bai/cho-gan-vitri ─────────────────
    public function choGanViTri(): JsonResponse
    {
        $assigned = LichSuViTri::whereNull('thoigian_roi')->pluck('macontainer')->toArray();

        $containers = Container::where('trangthai', 'trongbai')
            ->whereNotIn('macontainer', $assigned)
            ->with(['chuyentau.hangtau'])
            ->orderBy('thoigian_vaobai')
            ->get()
            ->map(fn ($c) => [
                'macontainer'     => $c->macontainer,
                'socontainer'     => $c->socontainer,
                'mascac'          => $c->chuyentau?->hangtau?->mascac,
                'sovoyage'        => $c->chuyentau?->sovoyage,
                'thoigian_vaobai' => $c->thoigian_vaobai?->format('d/m/Y H:i'),
            ]);

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

        $query = OBai::where('trangthai', 'trong')->with('khuvucbai');
        if ($excludeObai) $query->where('maobai', '!=', $excludeObai);
        if ($maxTang !== null) $query->where('tang', '<=', $maxTang);

        $occupiedKeys = OBai::where('trangthai', 'dangsudung')
            ->get(['makhuvuc', 'khoang', 'hang', 'tang'])
            ->mapWithKeys(fn ($o) => ["{$o->makhuvuc}-{$o->khoang}-{$o->hang}-{$o->tang}" => true])
            ->all();

        $emptySlots = $query->get()->filter(function ($o) use ($nhom, $occupiedKeys) {
            if ($o->khuvucbai?->loai_nhom !== $nhom) return false;
            if ($o->tang > 1) {
                $belowKey = "{$o->makhuvuc}-{$o->khoang}-{$o->hang}-" . ($o->tang - 1);
                if (!isset($occupiedKeys[$belowKey])) return false;
            }
            return true;
        });

        if ($emptySlots->isEmpty()) return collect();

        $occupied = DB::table('lichsuvitri')
            ->join('obai',      'lichsuvitri.maobai',      '=', 'obai.maobai')
            ->join('container', 'lichsuvitri.macontainer', '=', 'container.macontainer')
            ->join('chuyentau', 'container.machuyentau',   '=', 'chuyentau.machuyentau')
            ->whereNull('lichsuvitri.thoigian_roi')
            ->select('obai.makhuvuc', 'chuyentau.mahangtau', 'container.machuyentau')
            ->get();

        $blockHangTau = [];
        $blockChuyen  = [];
        $blockLoad    = [];

        foreach ($occupied as $r) {
            $blockHangTau[$r->makhuvuc][$r->mahangtau] = true;
            $blockChuyen[$r->makhuvuc][$r->machuyentau] = true;
            $blockLoad[$r->makhuvuc] = ($blockLoad[$r->makhuvuc] ?? 0) + 1;
        }

        $totalPerBlock = OBai::whereNot('trangthai', 'khonghoatdong')
            ->groupBy('makhuvuc')
            ->select('makhuvuc', DB::raw('COUNT(*) as total'))
            ->pluck('total', 'makhuvuc');

        return $emptySlots->map(function ($o) use ($container, $blockHangTau, $blockChuyen, $blockLoad, $totalPerBlock) {
            $score = 0;
            $kv    = $o->makhuvuc;

            if (!empty($blockChuyen[$kv][$container->machuyentau])) $score += 30;
            if (!empty($blockHangTau[$kv][$container->chuyentau?->mahangtau])) $score += 20;
            $score -= $o->tang * 10;
            $total  = $totalPerBlock[$kv] ?? 1;
            $score -= (int) round(($blockLoad[$kv] ?? 0) / $total * 20);

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
}
