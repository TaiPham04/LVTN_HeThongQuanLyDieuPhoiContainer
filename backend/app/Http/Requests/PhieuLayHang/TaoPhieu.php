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
            'biensoxe'    => 'nullable|string|max:20',
            'bienso_romo' => 'nullable|string|max:20',
            'mataixe'     => 'nullable|integer|exists:taixe,mataixe',
            'eta_tu'      => 'nullable|date',
            'eta_den'     => 'nullable|date',
            'ghichu'      => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'socontainer.required' => 'Số container là bắt buộc.',
        ];
    }
}
