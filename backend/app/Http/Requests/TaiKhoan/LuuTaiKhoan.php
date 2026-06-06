<?php

namespace App\Http\Requests\TaiKhoan;

use Illuminate\Foundation\Http\FormRequest;

class LuuTaiKhoan extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = (bool) $this->route('user');

        $rules = [
            'hoten'       => ['required', 'string', 'max:100'],
            'mavaitro'    => ['required', 'integer', 'exists:vaitro,mavaitro'],
            'sodienthoai' => ['nullable', 'string', 'max:20'],
            'tentochinhe' => ['nullable', 'string', 'max:255'],
        ];

        if (!$isUpdate) {
            $rules['email']   = ['required', 'email', 'max:255', 'unique:taikhoan,email'];
            $rules['matkhau'] = ['required', 'string', 'min:8'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'hoten.required'    => 'Họ tên là bắt buộc.',
            'hoten.max'         => 'Họ tên tối đa 100 ký tự.',
            'email.required'    => 'Email là bắt buộc.',
            'email.email'       => 'Email không hợp lệ.',
            'email.unique'      => 'Email này đã được sử dụng.',
            'matkhau.required'  => 'Mật khẩu là bắt buộc.',
            'matkhau.min'       => 'Mật khẩu phải có ít nhất 8 ký tự.',
            'mavaitro.required' => 'Vai trò là bắt buộc.',
            'mavaitro.exists'   => 'Vai trò không hợp lệ.',
        ];
    }
}
