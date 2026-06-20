<?php

namespace App\Http\Controllers\NhanVien\Bai;

use App\Http\Controllers\Controller;
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
            ->get(['makhuvuc', 'tenblock', 'sokhoang', 'sohang', 'sotang', 'lablock_lanh']);

        return response()->json(['data' => $blocks]);
    }

    // ─── GET /api/nv/bai/so-do-bai/{khuvucbai} ───────────────────
    public function show(KhuVucBai $khuvucbai): JsonResponse
    {
        $obaiList = $khuvucbai->obai()
            ->with(['vitriHienTai.container' => function ($q) {
                $q->select('macontainer', 'socontainer', 'bi_hong', 'trangthai_haiquan', 'thoigian_vaobai');
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
                'lablock_lanh' => (bool) $khuvucbai->lablock_lanh,
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
            ->with(['hangtau', 'chuyentau'])
            ->orderBy('thoigian_vaobai')
            ->get()
            ->map(fn ($c) => [
                'macontainer'     => $c->macontainer,
                'socontainer'     => $c->socontainer,
                'mascac'          => $c->hangtau?->mascac,
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

        $container = Container::findOrFail($request->macontainer);
        $obai      = OBai::findOrFail($request->maobai);

        if ($obai->trangthai !== 'trong') {
            return response()->json(['message' => 'Ô bãi này đã được sử dụng.'], 422);
        }
        if ($container->trangthai !== 'trongbai') {
            return response()->json(['message' => 'Container không ở trạng thái trong bãi.'], 422);
        }
        if (LichSuViTri::where('macontainer', $container->macontainer)->whereNull('thoigian_roi')->exists()) {
            return response()->json(['message' => 'Container đã được gán vị trí rồi.'], 422);
        }

        DB::transaction(function () use ($container, $obai, $request) {
            LichSuViTri::create([
                'macontainer'    => $container->macontainer,
                'maobai'         => $obai->maobai,
                'manhanvien'     => $request->user()->mataikhoan,
                'kieudichchuyen' => 'bandau',
                'thoigian_gan'   => now(),
            ]);
            $obai->update(['trangthai' => 'dangsudung']);
        });

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

        $obaiCu  = OBai::findOrFail($request->maobai_cu);
        $obaiMoi = OBai::findOrFail($request->maobai_moi);

        if ($obaiMoi->trangthai !== 'trong') {
            return response()->json(['message' => 'Ô đích đã được sử dụng.'], 422);
        }

        if ($this->coContTrenDau($obaiCu)) {
            return response()->json(['message' => 'Không thể đảo chuyển — có container đang xếp trên ô này.'], 422);
        }

        $lichSuCu = LichSuViTri::where('maobai', $obaiCu->maobai)
            ->whereNull('thoigian_roi')
            ->first();

        if (!$lichSuCu) {
            return response()->json(['message' => 'Không tìm thấy container tại ô này.'], 422);
        }

        DB::transaction(function () use ($obaiCu, $obaiMoi, $lichSuCu, $request) {
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
        });

        $socontainer = Container::find($lichSuCu->macontainer)?->socontainer ?? '';
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
        $query = OBai::where('trangthai', 'trong')->with('khuvucbai');
        if ($excludeObai) $query->where('maobai', '!=', $excludeObai);
        if ($maxTang)     $query->where('tang', '<=', $maxTang);
        $emptySlots = $query->get();

        if ($emptySlots->isEmpty()) return collect();

        $occupied = DB::table('lichsuvitri')
            ->join('obai',      'lichsuvitri.maobai',      '=', 'obai.maobai')
            ->join('container', 'lichsuvitri.macontainer', '=', 'container.macontainer')
            ->whereNull('lichsuvitri.thoigian_roi')
            ->select('obai.makhuvuc', 'container.mahangtau', 'container.machuyentau')
            ->get();

        $blockHangTau = [];
        $blockChuyen  = [];
        $blockLoad    = [];

        foreach ($occupied as $r) {
            $blockHangTau[$r->makhuvuc][$r->mahangtau] = true;
            if ($r->machuyentau) {
                $blockChuyen[$r->makhuvuc][$r->machuyentau] = true;
            }
            $blockLoad[$r->makhuvuc] = ($blockLoad[$r->makhuvuc] ?? 0) + 1;
        }

        $totalPerBlock = OBai::whereNot('trangthai', 'khonghoatdong')
            ->groupBy('makhuvuc')
            ->select('makhuvuc', DB::raw('COUNT(*) as total'))
            ->pluck('total', 'makhuvuc');

        return $emptySlots->map(function ($o) use ($container, $blockHangTau, $blockChuyen, $blockLoad, $totalPerBlock) {
            $score = 0;
            $kv    = $o->makhuvuc;

            if ($container->machuyentau && !empty($blockChuyen[$kv][$container->machuyentau])) $score += 30;
            if (!empty($blockHangTau[$kv][$container->mahangtau])) $score += 20;
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
