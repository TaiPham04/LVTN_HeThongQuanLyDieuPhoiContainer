<?php

namespace App\Http\Requests\TaiKhoan;

use Illuminate\Foundation\Http\FormRequest;

class ResetMatKhau extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'matkhau_moi' => ['required', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'matkhau_moi.required' => 'Mật khẩu mới là bắt buộc.',
            'matkhau_moi.min'      => 'Mật khẩu mới phải có ít nhất 8 ký tự.',
        ];
    }
}
