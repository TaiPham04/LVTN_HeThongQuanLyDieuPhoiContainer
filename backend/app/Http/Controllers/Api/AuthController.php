<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\Login;
use App\Http\Requests\Auth\Register;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    // ─── POST /api/auth/login ────────────────────────────────────
    public function login(Login $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        // Kiểm tra tài khoản tồn tại và mật khẩu đúng
        if (!$user || !Hash::check($request->password, $user->matkhau)) {
            return response()->json([
                'message' => 'Email hoặc mật khẩu không đúng.',
            ], 401);
        }

        // Kiểm tra tài khoản còn hoạt động
        if ($user->trangthai !== 'hoatdong') {
            return response()->json([
                'message' => 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
            ], 403);
        }

        // Xóa token cũ, tạo token mới
        $user->tokens()->delete();
        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng nhập thành công.',
            'token'   => $token,
            'user'    => new UserResource($user->load('vaitro')),
        ]);
    }

    // ─── POST /api/auth/register ─────────────────────────────────
    // Chỉ dành cho Khách hàng / Forwarder tự đăng ký
    public function register(Register $request): JsonResponse
    {
        $user = User::create([
            'mavaitro'    => 3, // khachhang
            'hoten'       => $request->hoten,
            'email'       => $request->email,
            'matkhau'     => Hash::make($request->password),
            'sodienthoai' => $request->sodienthoai,
            'tentochuc' => $request->tentochuc,
            'trangthai'   => 'hoatdong',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Đăng ký tài khoản thành công.',
            'token'   => $token,
            'user'    => new UserResource($user->load('vaitro')),
        ], 201);
    }

    // ─── POST /api/auth/logout ───────────────────────────────────
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Đăng xuất thành công.',
        ]);
    }

    // ─── GET /api/auth/me ────────────────────────────────────────
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()->load('vaitro')),
        ]);
    }

    // ─── PUT /api/auth/profile ───────────────────────────────────
    public function capNhatThongTin(Request $request): JsonResponse
    {
        $request->validate([
            'hoten'       => ['sometimes', 'string', 'max:100'],
            'sodienthoai' => ['sometimes', 'nullable', 'string', 'max:20'],
            'tentochuc' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();
        $user->update($request->only('hoten', 'sodienthoai', 'tentochuc'));

        return response()->json([
            'message' => 'Cập nhật thông tin thành công.',
            'user'    => new UserResource($user->fresh()->load('vaitro')),
        ]);
    }

    // ─── PUT /api/auth/password ──────────────────────────────────
    public function doiMatKhau(Request $request): JsonResponse
    {
        $request->validate([
            'matkhau_cu'  => ['required', 'string'],
            'matkhau_moi' => ['required', 'string', 'min:8', 'confirmed'],
        ], [
            'matkhau_cu.required'   => 'Vui lòng nhập mật khẩu cũ.',
            'matkhau_moi.required'  => 'Vui lòng nhập mật khẩu mới.',
            'matkhau_moi.min'       => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
            'matkhau_moi.confirmed' => 'Mật khẩu xác nhận không khớp.',
        ]);

        $user = $request->user();

        if (!Hash::check($request->matkhau_cu, $user->matkhau)) {
            return response()->json([
                'message' => 'Mật khẩu cũ không chính xác.',
            ], 422);
        }

        $user->update(['matkhau' => Hash::make($request->matkhau_moi)]);

        return response()->json([
            'message' => 'Đổi mật khẩu thành công.',
        ]);
    }
}