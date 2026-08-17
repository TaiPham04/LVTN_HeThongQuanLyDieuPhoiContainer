<?php

namespace App\Http\Controllers\KhachHang;

use App\Http\Controllers\Controller;
use App\Models\TaiXe;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class TaiXeKHController extends Controller
{
    // GET /api/kh/tai-xe
    public function index(Request $request): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        $data = TaiXe::with('taikhoan:mataikhoan,email')
            ->where('makhachhang', $makh)
            ->orderBy('hoten')
            ->get()
            ->map(fn ($tx) => [
                'mataixe'     => $tx->mataixe,
                'hoten'       => $tx->hoten,
                'sodienthoai' => $tx->sodienthoai,
                'cccd'        => $tx->cccd,
                'biensoxe'    => $tx->biensoxe,
                'trangthai'   => $tx->trangthai ?? 'hoatdong',
                'email_login' => $tx->taikhoan?->email,
                'created_at'  => $tx->created_at?->format('d/m/Y'),
            ]);

        return response()->json(['data' => $data]);
    }

    // POST /api/kh/tai-xe
    public function store(Request $request): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        $request->validate([
            'hoten'        => 'required|string|max:100',
            'sodienthoai'  => 'required|string|max:15|unique:taixe,sodienthoai',
            'cccd'         => 'required|string|max:20|unique:taixe,cccd',
            'biensoxe'     => 'nullable|string|max:20',
            'email'        => 'required|email|max:100|unique:taikhoan,email',
            'password'     => 'required|string|min:6|max:100',
        ], [
            'email.unique'       => 'Email này đã được sử dụng cho tài khoản khác.',
            'sodienthoai.unique' => 'Số điện thoại này đã được đăng ký.',
            'cccd.unique'        => 'CCCD này đã được đăng ký.',
            'email.required'     => 'Email đăng nhập là bắt buộc.',
            'password.min'       => 'Mật khẩu phải có ít nhất 6 ký tự.',
        ]);

        $result = DB::transaction(function () use ($request, $makh) {
            $taikhoan = \App\Models\User::create([
                'mavaitro'    => 4,
                'hoten'       => $request->hoten,
                'sodienthoai' => $request->sodienthoai,
                'email'       => $request->email,
                'matkhau'     => Hash::make($request->password),
                'trangthai'   => 'hoatdong',
            ]);

            $taixe = TaiXe::create([
                'mataikhoan'  => $taikhoan->mataikhoan,
                'makhachhang' => $makh,
                'hoten'       => $request->hoten,
                'sodienthoai' => $request->sodienthoai,
                'cccd'        => $request->cccd,
                'biensoxe'    => $request->biensoxe,
            ]);

            return compact('taikhoan', 'taixe');
        });

        return response()->json([
            'message' => "Đã thêm tài xế {$result['taixe']->hoten} thành công.",
            'data'    => [
                'mataixe'    => $result['taixe']->mataixe,
                'hoten'      => $result['taixe']->hoten,
                'sodienthoai'=> $result['taixe']->sodienthoai,
                'cccd'       => $result['taixe']->cccd,
                'biensoxe'   => $result['taixe']->biensoxe,
            ],
        ], 201);
    }

    // PATCH /api/kh/tai-xe/{taixe}
    public function update(Request $request, TaiXe $taixe): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        if ($taixe->makhachhang !== $makh) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        $request->validate([
            'hoten'       => 'sometimes|string|max:100',
            'sodienthoai' => ['sometimes', 'string', 'max:15', Rule::unique('taixe', 'sodienthoai')->ignore($taixe->mataixe, 'mataixe')],
            'biensoxe'    => 'nullable|string|max:20',
        ]);

        $taixe->update($request->only(['hoten', 'sodienthoai', 'biensoxe']));

        return response()->json([
            'message' => 'Cập nhật thông tin tài xế thành công.',
            'data'    => [
                'mataixe'    => $taixe->mataixe,
                'hoten'      => $taixe->hoten,
                'sodienthoai'=> $taixe->sodienthoai,
                'biensoxe'   => $taixe->biensoxe,
            ],
        ]);
    }

    // PATCH /api/kh/tai-xe/{taixe}/mat-khau
    public function doiMatKhau(Request $request, TaiXe $taixe): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        if ($taixe->makhachhang !== $makh) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        $request->validate([
            'password' => 'required|string|min:6|max:100',
        ], [
            'password.required' => 'Vui lòng nhập mật khẩu mới.',
            'password.min'      => 'Mật khẩu phải có ít nhất 6 ký tự.',
        ]);

        $taikhoan = $taixe->taikhoan;
        if (!$taikhoan) {
            return response()->json(['message' => 'Không tìm thấy tài khoản đăng nhập của tài xế.'], 404);
        }

        $taikhoan->update(['matkhau' => Hash::make($request->password)]);

        return response()->json(['message' => 'Đã cập nhật mật khẩu thành công.']);
    }

    // DELETE /api/kh/tai-xe/{taixe}
    public function destroy(Request $request, TaiXe $taixe): JsonResponse
    {
        $makh = $request->user()->mataikhoan;

        if ($taixe->makhachhang !== $makh) {
            return response()->json(['message' => 'Không có quyền thao tác.'], 403);
        }

        // Không xóa nếu tài xế có phiếu lấy hàng đang chờ
        $coPhieuDang = $taixe->phieulayhangs()
            ->where('trangthai', 'cho_lay')
            ->exists();

        if ($coPhieuDang) {
            return response()->json(['message' => 'Tài xế đang có phiếu lấy hàng chờ xử lý, không thể xóa.'], 422);
        }

        $hoten = $taixe->hoten;

        DB::transaction(function () use ($taixe) {
            // Vô hiệu hóa tài khoản đăng nhập tương ứng — nếu không, tài xế đã "xóa"
            // vẫn đăng nhập được vào hệ thống (chỉ mất quyền truy cập dữ liệu tài xế).
            $taikhoan = $taixe->taikhoan;
            if ($taikhoan && $taikhoan->trangthai !== 'khonghoatdong') {
                $taikhoan->update(['trangthai' => 'khonghoatdong']);
                $taikhoan->tokens()->delete();
            }

            $taixe->delete();
        });

        return response()->json(['message' => "Đã xóa tài xế {$hoten}."]);
    }
}
