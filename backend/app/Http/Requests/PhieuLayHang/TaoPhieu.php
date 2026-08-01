<?php

namespace App\Http\Requests\PhieuLayHang;

use Illuminate\Foundation\Http\FormRequest;

class TaoPhieu extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'socontainer' => 'required|string|max:20',
            'biensoxe'    => ['required', 'string', 'max:20', 'regex:/^\d{2}[A-Z]-\d{4,5}$/'],
            'bienso_romo' => 'nullable|string|max:20',
            'mataixe'     => 'required|integer|exists:taixe,mataixe',
            'eta_tu'      => 'nullable|date',
            'eta_den'     => 'nullable|date',
            'ghichu'      => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'socontainer.required' => 'Số container là bắt buộc.',
            'mataixe.required'     => 'Vui lòng chọn tài xế.',
            'biensoxe.required'    => 'Vui lòng nhập biển số xe.',
            'biensoxe.regex'       => 'Biển số xe không đúng định dạng (VD: 51C-12345).',
        ];
    }
}
