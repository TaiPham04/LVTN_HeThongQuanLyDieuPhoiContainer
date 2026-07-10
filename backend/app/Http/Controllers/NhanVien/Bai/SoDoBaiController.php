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

        $container = Container::with('loaicontainer')->findOrFail($request->macontainer);
        $obai      = OBai::with('khuvucbai')->findOrFail($request->maobai);

        if ($obai->trangthai !== 'trong') {
            return response()->json(['message' => 'Ô bãi này đã được sử dụng.'], 422);
        }
        if ($container->trangthai !== 'trongbai') {
            return response()->json(['message' => 'Container không ở trạng thái trong bãi.'], 422);
        }
        if (LichSuViTri::where('macontainer', $container->macontainer)->whereNull('thoigian_roi')->exists()) {
            return response()->json(['message' => 'Container đã được gán vị trí rồi.'], 422);
        }

        $loai   = $container->loaicontainer;
        $khuvuc = $obai->khuvucbai;

        // L3: Container lạnh / thường phải đúng block
        if ((bool) $loai?->lalanh !== (bool) $khuvuc?->lablock_lanh) {
            $msg = $loai?->lalanh
                ? 'Container lạnh phải được đặt vào block lạnh.'
                : 'Ô bãi này thuộc block lạnh, chỉ dành cho container lạnh.';
            return response()->json(['message' => $msg], 422);
        }

        // Hàng nguy hiểm phải vào block hàng nguy hiểm và ngược lại
        if ((bool) $loai?->lahangnguy !== (bool) $khuvuc?->lablock_hangnguy) {
            $msg = $loai?->lahangnguy
                ? 'Container hàng nguy hiểm phải được đặt vào block hàng nguy hiểm.'
                : 'Block này chỉ dành cho container hàng nguy hiểm.';
            return response()->json(['message' => $msg], 422);
        }

        // Kiểm tra tầng tối đa của loại container
        $tangToiDa = $loai?->tang_toi_da;
        if ($tangToiDa !== null && $obai->tang > $tangToiDa) {
            return response()->json([
                'message' => "Loại container {$loai->tenloai} chỉ được đặt tối đa tầng {$tangToiDa}.",
            ], 422);
        }

        // Kiểm tra container bên dưới có cho phép xếp chồng không
        if ($obai->tang > 1) {
            $obaiDuoi = OBai::where('makhuvuc', $obai->makhuvuc)
                ->where('khoang', $obai->khoang)
                ->where('hang', $obai->hang)
                ->where('tang', $obai->tang - 1)
                ->where('trangthai', 'dangsudung')
                ->first();

            if ($obaiDuoi) {
                $lichSuDuoi = LichSuViTri::where('maobai', $obaiDuoi->maobai)
                    ->whereNull('thoigian_roi')
                    ->with('container.loaicontainer')
                    ->first();

                if ($lichSuDuoi?->container?->loaicontainer?->cho_phep_xep_chong === false) {
                    $tenLoaiDuoi = $lichSuDuoi->container->loaicontainer->tenloai;
                    return response()->json([
                        'message' => "Không thể đặt container lên ô này — {$tenLoaiDuoi} bên dưới không cho phép xếp chồng.",
                    ], 422);
                }
            }
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

        $obaiMoi->load('khuvucbai');

        $lichSuCu = LichSuViTri::where('maobai', $obaiCu->maobai)
            ->whereNull('thoigian_roi')
            ->with(['container.loaicontainer'])
            ->first();

        if (!$lichSuCu) {
            return response()->json(['message' => 'Không tìm thấy container tại ô này.'], 422);
        }

        $loaiDich  = $lichSuCu->container?->loaicontainer;
        $khuvucMoi = $obaiMoi->khuvucbai;

        // L4: Container lạnh / thường phải đúng block
        if ((bool) $loaiDich?->lalanh !== (bool) $khuvucMoi?->lablock_lanh) {
            $msg = $loaiDich?->lalanh
                ? 'Container lạnh phải được đặt vào block lạnh.'
                : 'Ô bãi đích thuộc block lạnh, chỉ dành cho container lạnh.';
            return response()->json(['message' => $msg], 422);
        }

        // Hàng nguy hiểm phải đúng block
        if ((bool) $loaiDich?->lahangnguy !== (bool) $khuvucMoi?->lablock_hangnguy) {
            $msg = $loaiDich?->lahangnguy
                ? 'Container hàng nguy hiểm phải được đặt vào block hàng nguy hiểm.'
                : 'Block đích chỉ dành cho container hàng nguy hiểm.';
            return response()->json(['message' => $msg], 422);
        }

        // Kiểm tra tầng tối đa
        $tangToiDa = $loaiDich?->tang_toi_da;
        if ($tangToiDa !== null && $obaiMoi->tang > $tangToiDa) {
            return response()->json([
                'message' => "Loại container {$loaiDich->tenloai} chỉ được đặt tối đa tầng {$tangToiDa}.",
            ], 422);
        }

        // Kiểm tra container bên dưới ô đích có cho phép xếp chồng không
        if ($obaiMoi->tang > 1) {
            $obaiDuoi = OBai::where('makhuvuc', $obaiMoi->makhuvuc)
                ->where('khoang', $obaiMoi->khoang)
                ->where('hang', $obaiMoi->hang)
                ->where('tang', $obaiMoi->tang - 1)
                ->where('trangthai', 'dangsudung')
                ->first();

            if ($obaiDuoi) {
                $lichSuDuoi = LichSuViTri::where('maobai', $obaiDuoi->maobai)
                    ->whereNull('thoigian_roi')
                    ->with('container.loaicontainer')
                    ->first();

                if ($lichSuDuoi?->container?->loaicontainer?->cho_phep_xep_chong === false) {
                    $tenLoaiDuoi = $lichSuDuoi->container->loaicontainer->tenloai;
                    return response()->json([
                        'message' => "Không thể đảo chuyển vào ô này — {$tenLoaiDuoi} bên dưới không cho phép xếp chồng.",
                    ], 422);
                }
            }
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
        $container->loadMissing('loaicontainer');
        $loai            = $container->loaicontainer;
        $laLanhContainer = (bool) $loai?->lalanh;
        $laHangNguy      = (bool) $loai?->lahangnguy;
        $tangToiDa       = $loai?->tang_toi_da;

        $query = OBai::where('trangthai', 'trong')->with('khuvucbai');
        if ($excludeObai) $query->where('maobai', '!=', $excludeObai);
        $tangGioiHan = $tangToiDa;
        if ($maxTang !== null) {
            $tangGioiHan = $tangGioiHan !== null ? min($tangGioiHan, $maxTang) : $maxTang;
        }
        if ($tangGioiHan !== null) $query->where('tang', '<=', $tangGioiHan);

        $noStackKeys = DB::table('lichsuvitri')
            ->join('obai',         'lichsuvitri.maobai',      '=', 'obai.maobai')
            ->join('container',    'lichsuvitri.macontainer', '=', 'container.macontainer')
            ->join('loaicontainer','container.maloai',        '=', 'loaicontainer.maloai')
            ->whereNull('lichsuvitri.thoigian_roi')
            ->where('loaicontainer.cho_phep_xep_chong', false)
            ->select('obai.makhuvuc', 'obai.khoang', 'obai.hang',
                     DB::raw('(obai.tang + 1) as tang_tren'))
            ->get()
            ->map(fn ($r) => "{$r->makhuvuc}-{$r->khoang}-{$r->hang}-{$r->tang_tren}")
            ->flip()
            ->all();

        $emptySlots = $query->get()->filter(function ($o) use ($laLanhContainer, $laHangNguy, $noStackKeys) {
            if ((bool) $o->khuvucbai?->lablock_lanh     !== $laLanhContainer) return false;
            if ((bool) $o->khuvucbai?->lablock_hangnguy !== $laHangNguy)      return false;
            $key = "{$o->makhuvuc}-{$o->khoang}-{$o->hang}-{$o->tang}";
            return !isset($noStackKeys[$key]);
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
