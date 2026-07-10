<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\TaiKhoan\LuuTaiKhoan;
use App\Http\Requests\TaiKhoan\ResetMatKhau;
use App\Http\Resources\TaiKhoanResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class TaiKhoanController extends Controller
{
    // ─── GET /api/admin/tai-khoan ─────────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $query = User::with('vaitro');

        if ($request->mavaitro) {
            $query->where('mavaitro', $request->mavaitro);
        }

        if ($request->trangthai) {
            $query->where('trangthai', $request->trangthai);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('hoten', 'like', "%{$request->search}%")
                  ->orWhere('email', 'like', "%{$request->search}%");
            });
        }

        $data = $query->orderBy('created_at', 'desc')
                      ->paginate($request->get('per_page', 15), ['*'], 'trang', (int) $request->get('trang', 1));

        return response()->json([
            'data' => TaiKhoanResource::collection($data->items()),
            'meta' => [
                'trang_hien' => $data->currentPage(),
                'tong_trang' => $data->lastPage(),
                'tong'       => $data->total(),
                'per_page'     => $data->perPage(),
            ],
        ]);
    }

    // ─── POST /api/admin/tai-khoan ────────────────────────────────
    public function store(LuuTaiKhoan $request): JsonResponse
    {
        $user = User::create([
            ...$request->only('hoten', 'email', 'mavaitro', 'sodienthoai', 'tentochuc'),
            'matkhau'   => Hash::make($request->matkhau),
            'trangthai' => 'hoatdong',
        ]);

        return response()->json([
            'message' => "Đã tạo tài khoản {$user->email} thành công.",
            'data'    => new TaiKhoanResource($user->load('vaitro')),
        ], 201);
    }

    // ─── PUT /api/admin/tai-khoan/{user} ──────────────────────────
    public function update(LuuTaiKhoan $request, User $user): JsonResponse
    {
        $user->update($request->only('hoten', 'mavaitro', 'sodienthoai', 'tentochuc'));

        return response()->json([
            'message' => "Cập nhật tài khoản {$user->email} thành công.",
            'data'    => new TaiKhoanResource($user->fresh()->load('vaitro')),
        ]);
    }

    // ─── PATCH /api/admin/tai-khoan/{user}/vo-hieu-hoa ────────────
    public function voHieuHoa(Request $request, User $user): JsonResponse
    {
        if ($user->mataikhoan === $request->user()->mataikhoan) {
            return response()->json([
                'message' => 'Không thể vô hiệu hóa tài khoản của chính mình.',
            ], 422);
        }

        if ($user->trangthai === 'khonghoatdong') {
            return response()->json([
                'message' => 'Tài khoản này đã bị vô hiệu hóa trước đó.',
            ], 422);
        }

        $user->update(['trangthai' => 'khonghoatdong']);
        $user->tokens()->delete();

        return response()->json([
            'message' => "Tài khoản {$user->email} đã bị vô hiệu hóa. Tất cả phiên đăng nhập đã bị thu hồi.",
        ]);
    }

    // ─── PATCH /api/admin/tai-khoan/{user}/khoiphuc ───────────────
    public function khoiPhuc(User $user): JsonResponse
    {
        if ($user->trangthai === 'hoatdong') {
            return response()->json([
                'message' => 'Tài khoản này đang hoạt động bình thường.',
            ], 422);
        }

        $user->update(['trangthai' => 'hoatdong']);

        return response()->json([
            'message' => "Tài khoản {$user->email} đã được khôi phục thành công.",
        ]);
    }

    // ─── PATCH /api/admin/tai-khoan/{user}/reset-mat-khau ─────────
    public function resetMatKhau(ResetMatKhau $request, User $user): JsonResponse
    {
        $user->update(['matkhau' => Hash::make($request->matkhau_moi)]);
        $user->tokens()->delete();

        return response()->json([
            'message' => "Đã đặt lại mật khẩu cho {$user->email}. Tất cả phiên đăng nhập cũ đã bị thu hồi.",
        ]);
    }
}
