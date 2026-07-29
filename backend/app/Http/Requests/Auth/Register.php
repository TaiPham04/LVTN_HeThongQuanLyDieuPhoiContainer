<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class Register extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hoten'                => ['required', 'string', 'max:100'],
            'email'                => ['required', 'email', 'unique:taikhoan,email'],
            'password'             => ['required', 'string', 'min:8', 'confirmed'],
            'sodienthoai'          => ['nullable', 'string', 'max:20'],
            'tentochuc'          => ['required', 'string', 'max:255'],
        ];
    }

    public function messages(): array
    {
        return [
            'hoten.required'       => 'Vui lòng nhập họ tên.',
            'email.required'       => 'Vui lòng nhập email.',
            'email.email'          => 'Email không đúng định dạng.',
            'email.unique'         => 'Email này đã được sử dụng.',
            'password.required'    => 'Vui lòng nhập mật khẩu.',
            'password.min'         => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'password.confirmed'   => 'Mật khẩu xác nhận không khớp.',
            'tentochuc.required' => 'Vui lòng nhập tên công ty.',
        ];
    }
}