<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    // Dùng: middleware('role:admin')
    //       middleware('role:admin,nhanvien')
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Chưa đăng nhập.'], 401);
        }

        if ($user->trangthai !== 'hoatdong') {
            return response()->json(['message' => 'Tài khoản đã bị vô hiệu hóa.'], 403);
        }

        $tenvaitro = $user->vaitro?->tenvaitro;

        if (!in_array($tenvaitro, $roles)) {
            return response()->json(['message' => 'Bạn không có quyền thực hiện thao tác này.'], 403);
        }

        return $next($request);
    }
}