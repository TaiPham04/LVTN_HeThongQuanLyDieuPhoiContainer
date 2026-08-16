<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ChuyenTau;
use App\Models\Container;
use App\Models\LoaiContainer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Collection;

// ─── ISO size/type → maloai map ───────────────────────────────────────────────
// Dựa theo mã ISO 6346 kết hợp với bảng loaicontainer trong hệ thống
// Key: chuỗi thường gặp trên manifest | Value: maloai
const SIZE_TYPE_MAP = [
    '20DC' => 1,  // Container 20 feet khô
    "20'DC" => 1,
    '20DV' => 1,  // Dry Van = Dry Container
    '20GP' => 1,  // General Purpose = Dry
    '20ST' => 1,  // Standard = 20DC
    '40DC' => 2,  // Container 40 feet khô
    "40'DC" => 2,
    '40DV' => 2,
    '40GP' => 2,
    '40ST' => 2,
    '40HC' => 3,  // Container 40 feet cao (High Cube)
    "40'HC" => 3,
    '40HQ' => 3,  // HQ = HC trên một số manifest
    '40HR' => 3,
    '20RF' => 4,  // Container 20 feet lạnh (Reefer)
    "20'RF" => 4,
    '20RE' => 4,
    '40RF' => 5,  // Container 40 feet lạnh cao
    "40'RF" => 5,
    '40RE' => 5,
    '40RFHC' => 14, // Reefer HC 40ft
    '40RH'  => 14,
    '20OT' => 6,  // Open Top 20ft
    "20'OT" => 6,
    '40OT' => 7,  // Open Top 40ft
    "40'OT" => 7,
    '20FR' => 8,  // Flat Rack 20ft
    "20'FR" => 8,
    '40FR' => 9,  // Flat Rack 40ft
    "40'FR" => 9,
    '20PF' => 10, // Platform 20ft
    '40PF' => 11, // Platform 40ft
    '20TK' => 12, // ISO Tank 20ft
    '20VH' => 13, // Ventilated 20ft
    '45HC' => 15, // Dry HC 45ft
    '45HQ' => 15,
];

// ─── Inner import class ───────────────────────────────────────────────────────
// Đọc đúng sheet index 0 ("Manifest"), tránh bị đọc nhầm sheet khác
class ManifestSheetImport implements ToCollection, WithHeadingRow
{
    public Collection $rows;

    public function collection(Collection $rows): void
    {
        $this->rows = $rows;
    }
}

class ManifestImport implements \Maatwebsite\Excel\Concerns\WithMultipleSheets
{
    public ManifestSheetImport $sheet;

    public function __construct()
    {
        $this->sheet = new ManifestSheetImport();
    }

    // Chỉ đọc sheet index 0 (sheet "Manifest")
    public function sheets(): array
    {
        return [0 => $this->sheet];
    }
}

// ─── Controller ───────────────────────────────────────────────────────────────
class ManifestController extends Controller
{
    // GET /api/admin/manifest/template
    public function template(): \Symfony\Component\HttpFoundation\BinaryFileResponse
    {
        $path = storage_path('app/templates/manifest_template.xlsx');

        if (!file_exists($path)) {
            $this->generateTemplate($path);
        }

        return response()->download($path, 'manifest_template.xlsx');
    }

    // POST /api/admin/manifest/import
    public function import(Request $request): JsonResponse
    {
        $request->validate([
            'machuyentau' => ['required', 'exists:chuyentau,machuyentau'],
            'file'        => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $chuyen = ChuyenTau::findOrFail($request->machuyentau);

        if ($chuyen->trangthai !== 'dalenlich') {
            return response()->json(['message' => 'Chỉ được import manifest cho chuyến tàu đang ở trạng thái "Đã lên lịch". Tàu đã cập cảng hoặc đã rời bến không thể import thêm.'], 422);
        }

        $daImport = Container::where('machuyentau', $chuyen->machuyentau)
            ->where('loai_hinh', 'nhap')
            ->where('trangthai', 'choxacnhan')
            ->count();

        if ($daImport > 0) {
            return response()->json([
                'message'    => "Chuyến tàu này đã có {$daImport} container từ manifest. Xác nhận ghi đè?",
                'can_force'  => true,
                'so_da_nhap' => $daImport,
            ], 409);
        }

        return $this->processImport($request, $chuyen);
    }

    // POST /api/admin/manifest/import-force
    public function importForce(Request $request): JsonResponse
    {
        $request->validate([
            'machuyentau' => ['required', 'exists:chuyentau,machuyentau'],
            'file'        => ['required', 'file', 'mimes:xlsx,xls,csv', 'max:10240'],
        ]);

        $chuyen = ChuyenTau::findOrFail($request->machuyentau);

        if ($chuyen->trangthai !== 'dalenlich') {
            return response()->json(['message' => 'Chỉ được import manifest cho chuyến tàu đang ở trạng thái "Đã lên lịch". Tàu đã cập cảng hoặc đã rời bến không thể import thêm.'], 422);
        }

        return DB::transaction(function () use ($request, $chuyen) {
            Container::where('machuyentau', $chuyen->machuyentau)
                ->where('loai_hinh', 'nhap')
                ->where('trangthai', 'choxacnhan')
                ->delete();

            return $this->processImport($request, $chuyen);
        });
    }

    // GET /api/admin/manifest/danh-sach/{machuyentau}
    public function danhSach(int $machuyentau): JsonResponse
    {
        $list = Container::with('loaicontainer')
            ->where('machuyentau', $machuyentau)
            ->where('loai_hinh', 'nhap')
            ->orderBy('trangthai')
            ->orderBy('socontainer')
            ->get()
            ->map(fn ($c) => [
                'macontainer'   => $c->macontainer,
                'socontainer'   => $c->socontainer,
                'tenloai'       => $c->loaicontainer?->tenloai,
                'so_vandon'     => $c->so_vandon,
                'ten_consignee' => $c->ten_consignee,
                'soniemchi'     => $c->soniemchi,
                'trongluong_kg' => $c->trongluong_kg,
                'mota_hanghoa'  => $c->mota_hanghoa,
                'trangthai'     => $c->trangthai,
                'bi_hong'       => (bool) $c->bi_hong,
            ]);

        return response()->json(['data' => $list, 'total' => $list->count()]);
    }

    // ─── Core import logic ────────────────────────────────────────────────────
    private function processImport(Request $request, ChuyenTau $chuyen): JsonResponse
    {
        $import = new ManifestImport();
        Excel::import($import, $request->file('file'));

        $rows = $import->sheet->rows ?? collect();

        if ($rows->isEmpty()) {
            return response()->json(['message' => 'File không có dữ liệu.'], 422);
        }

        $successes = [];
        $errors    = [];

        // Cache số container đã tồn tại trong hệ thống (nhap)
        $existing = Container::where('loai_hinh', 'nhap')
            ->pluck('socontainer')
            ->map(fn ($s) => Str::upper(trim($s)))
            ->flip();

        foreach ($rows as $i => $row) {
            $line = $i + 2;

            // ── Số container ──────────────────────────────────────────────
            $socontainer = $this->extractCol($row, ['socontainer', 'container_no', 'container_number', 'cont_no', 'cntr_no', 'equipment_no']);
            $socontainer = Str::upper(preg_replace('/[\s\-]/', '', $socontainer)); // bỏ khoảng trắng/gạch

            if (!$socontainer) {
                $errors[] = "Dòng {$line}: Thiếu số container, bỏ qua.";
                continue;
            }

            if (isset($existing[$socontainer])) {
                $errors[] = "Dòng {$line}: {$socontainer} đã tồn tại, bỏ qua.";
                continue;
            }

            // ── Loại container (size_type) ─────────────────────────────────
            $sizeTypeRaw = Str::upper(trim(
                $this->extractCol($row, ['size_type', 'sizetype', 'loai', 'loai_container', 'container_type', 'type', 'iso_type', 'cont_type'])
            ));

            $maloai = $this->resolveMaLoai($sizeTypeRaw);

            if (!$maloai) {
                $errors[] = "Dòng {$line}: {$socontainer} — không nhận dạng được loại '{$sizeTypeRaw}', bỏ qua.";
                continue;
            }

            // ── Niêm chì — bắt buộc ─────────────────────────────────────────
            $soniemchi = $this->extractCol($row, ['soniemchi', 'seal', 'seal_no', 'seal_number', 'niemchi']) ?: null;

            if (!$soniemchi) {
                $errors[] = "Dòng {$line}: {$socontainer} — thiếu số niêm chì, bỏ qua.";
                continue;
            }

            // ── Các trường tuỳ chọn ────────────────────────────────────────
            $soVanDon    = $this->extractCol($row, ['so_vandon', 'vandon', 'bl_no', 'b_l_no', 'bill_of_lading', 'bl', 'mbl', 'hbl']) ?: null;
            $consignee   = $this->extractCol($row, ['ten_consignee', 'consignee', 'nguoi_nhan', 'receiver', 'notify_party']) ?: null;
            $trongluong  = $this->extractCol($row, ['trongluong_kg', 'gross_weight', 'gw', 'weight', 'gross_wt']);
            $trongluong  = is_numeric($trongluong) ? (float) $trongluong : null;
            $mota        = $this->extractCol($row, ['mota_hanghoa', 'description', 'commodity', 'cargo_desc', 'mo_ta', 'goods_description']) ?: null;

            $successes[] = [
                'socontainer'       => $socontainer,
                'maloai'            => $maloai,
                'machuyentau'       => $chuyen->machuyentau,
                'makhachhang'       => null,
                'loai_hinh'         => 'nhap',
                'so_vandon'         => $soVanDon ? Str::upper(trim($soVanDon)) : null,
                'ten_consignee'     => $consignee ? trim($consignee) : null,
                'soniemchi'         => $soniemchi ? trim($soniemchi) : null,
                'trongluong_kg'     => $trongluong,
                'mota_hanghoa'      => $mota,
                'trangthai'         => 'choxacnhan',
                ...Container::phanLuongNgauNhien(),
                'created_at'        => now(),
                'updated_at'        => now(),
            ];

            $existing[$socontainer] = true;
        }

        if (!empty($successes)) {
            DB::transaction(function () use ($successes) {
                foreach (array_chunk($successes, 500) as $chunk) {
                    DB::table('container')->insert($chunk);
                }
            });
        }

        return response()->json([
            'message'       => "Import hoàn tất: " . count($successes) . " container, " . count($errors) . " bỏ qua.",
            'so_thanh_cong' => count($successes),
            'so_loi'        => count($errors),
            'errors'        => $errors,
        ]);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    // Tìm giá trị từ row theo danh sách tên cột có thể có (case-insensitive)
    private function extractCol($row, array $keys): string
    {
        $rowLower = [];
        foreach ($row as $k => $v) {
            $rowLower[Str::lower(trim($k))] = $v;
        }

        foreach ($keys as $key) {
            $val = $rowLower[Str::lower($key)] ?? null;
            if ($val !== null && trim((string) $val) !== '') {
                return trim((string) $val);
            }
        }

        return '';
    }

    // Chuyển size_type từ manifest → maloai trong hệ thống
    private function resolveMaLoai(string $sizeType): ?int
    {
        if (!$sizeType) return null;

        // Tra bảng cứng trước
        if (isset(SIZE_TYPE_MAP[$sizeType])) {
            return SIZE_TYPE_MAP[$sizeType];
        }

        // Fallback: tra DB theo maloai số
        if (is_numeric($sizeType)) {
            $loai = LoaiContainer::find((int) $sizeType);
            return $loai?->maloai;
        }

        // Fallback: so khớp mờ theo kieu_cont + size
        $size = (int) substr($sizeType, 0, 2);   // 20, 40, 45
        $type = substr($sizeType, 2);              // DC, HC, RF, OT, FR, TK...

        if ($size && $type) {
            $loai = LoaiContainer::where('kieu_cont', $type)
                ->orderByRaw("ABS(? - CAST(REGEXP_SUBSTR(tenloai, '[0-9]+') AS UNSIGNED))", [$size])
                ->first();
            return $loai?->maloai;
        }

        return null;
    }

    // Tạo file Excel mẫu
    private function generateTemplate(string $path): void
    {
        $dir = dirname($path);
        if (!is_dir($dir)) mkdir($dir, 0755, true);

        $spreadsheet = new \PhpOffice\PhpSpreadsheet\Spreadsheet();

        // ── Sheet 1: Manifest (sheet duy nhất được import) ────────────
        $sheet = $spreadsheet->getActiveSheet()->setTitle('Manifest');

        // Row 1 = tên cột thực tế (keys) — đây là dòng header importer đọc
        $cols = [
            'A' => ['socontainer',   'Số Container *',           'CCE5FF'],
            'B' => ['size_type',     'Loại Size/Type *',          'CCE5FF'],
            'C' => ['so_vandon',     'Số Vận Đơn (B/L No.)',      'D5F5E3'],
            'D' => ['ten_consignee', 'Consignee (Người nhận)',     'D5F5E3'],
            'E' => ['soniemchi',     'Niêm Chì (Seal No.) *',      'CCE5FF'],
            'F' => ['trongluong_kg', 'Trọng lượng (kg)',           'FEF9E7'],
            'G' => ['mota_hanghoa',  'Mô tả hàng hóa (Commodity)','FEF9E7'],
        ];

        foreach ($cols as $col => [$key, $label, $bg]) {
            // Row 1: key (importer đọc dòng này làm header — CHỈ dòng này, không thêm dòng nhãn
            // phụ nào nữa vì WithHeadingRow sẽ đọc mọi dòng sau đó thành dữ liệu thật)
            $sheet->setCellValue("{$col}1", $key);
            $sheet->getStyle("{$col}1")->applyFromArray([
                'font'      => ['bold' => true, 'size' => 10, 'color' => ['rgb' => '1A1A2E']],
                'fill'      => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => $bg]],
                'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_CENTER],
                'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN, 'color' => ['rgb' => 'AAAAAA']]],
            ]);

            // Chú thích tên cột đặt ở comment ô, không chiếm 1 dòng dữ liệu riêng
            $sheet->getComment("{$col}1")->getText()->createTextRun($label);
        }

        // Row 2+: Dữ liệu ví dụ (xoá trước khi dùng thật)
        $examples = [
            ['MSCU1234560', '20DC', 'MSCUVN123456', 'CONG TY TNHH ABC VIET NAM',  'VN123456', 18500, 'Linh kien dien tu'],
            ['TCKU2345671', '40HC', 'MSCUVN234567', 'CONG TY CP XYZ TRADING',      'VN234567', 26000, 'Vai soi tong hop'],
            ['CSNU3456782', '20RF', 'MSCUVN345678', 'CONG TY TNHH THUC PHAM AN',  'VN345678', 22000, 'Hang dong lanh'],
            ['HLXU4567893', '40HC', 'HLCUVN456789', 'CONG TY CP MAY MAC NAM',     'VN456789', 24500, 'Quan ao may san'],
            ['OOLU5678904', '40RF', 'OOCUVN567890', 'CONG TY TNHH DUOC PHAM',     'VN567890', 21000, 'Duoc pham bao quan lanh'],
        ];

        foreach ($examples as $r => $example) {
            foreach (array_values($example) as $c => $val) {
                $cell = chr(65 + $c) . ($r + 2);
                $sheet->setCellValue($cell, $val);
                $sheet->getStyle($cell)->applyFromArray([
                    'borders'   => ['allBorders' => ['borderStyle' => \PhpOffice\PhpSpreadsheet\Style\Border::BORDER_HAIR, 'color' => ['rgb' => 'DDDDDD']]],
                    'alignment' => ['horizontal' => \PhpOffice\PhpSpreadsheet\Style\Alignment::HORIZONTAL_LEFT],
                ]);
            }
        }

        // Ghi chú cuối
        $noteRow = count($examples) + 3;
        $sheet->setCellValue("A{$noteRow}", '* Bắt buộc. Dữ liệu từ dòng 2 (xoá các dòng ví dụ trên trước khi upload). Xem sheet "Ma Size-Type" để tra mã loại container. Trỏ chuột vào tiêu đề cột để xem chú thích.');
        $sheet->mergeCells("A{$noteRow}:G{$noteRow}");
        $sheet->getStyle("A{$noteRow}")->getFont()->setItalic(true)->setSize(9)->setColor(new \PhpOffice\PhpSpreadsheet\Style\Color('FF888888'));

        foreach (range('A', 'G') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        // ── Sheet 2: Bảng Size/Type (tham khảo) ─────────────────────
        $sheet2 = $spreadsheet->createSheet()->setTitle('Ma Size-Type');
        $sheet2->setCellValue('A1', 'Mã size_type');
        $sheet2->setCellValue('B1', 'Tên loại container');
        $sheet2->setCellValue('C1', 'Mã tương đương');
        $sheet2->getStyle('A1:C1')->applyFromArray([
            'font' => ['bold' => true],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E8EAF6']],
        ]);

        $sizeTypes = [
            ['20DC','Container 20ft Khô (Dry)','20DV, 20GP, 20ST'],
            ['40DC','Container 40ft Khô (Dry)','40DV, 40GP, 40ST'],
            ['40HC','Container 40ft Cao (High Cube)','40HQ, 40HR'],
            ['20RF','Container 20ft Lạnh (Reefer)','20RE'],
            ['40RF','Container 40ft Lạnh (Reefer)','40RE'],
            ['40RFHC','Container 40ft Lạnh Cao','40RH'],
            ['20OT','Open Top 20ft',''],
            ['40OT','Open Top 40ft',''],
            ['20FR','Flat Rack 20ft',''],
            ['40FR','Flat Rack 40ft',''],
            ['20TK','ISO Tank 20ft',''],
            ['45HC','Dry High Cube 45ft','45HQ'],
        ];

        foreach ($sizeTypes as $r => $row) {
            foreach ($row as $c => $val) {
                $sheet2->setCellValue(chr(65 + $c) . ($r + 2), $val);
            }
        }

        foreach (range('A', 'C') as $col) {
            $sheet2->getColumnDimension($col)->setAutoSize(true);
        }

        $spreadsheet->setActiveSheetIndex(0);
        $writer = new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($spreadsheet);
        $writer->save($path);
    }
}
