<?php

namespace App\Http\Requests\HangTau;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuHangTau extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = (bool) $this->route('hangtau');

        $rules = [
            'tenhangtau' => ['required', 'string', 'max:255'],
            'quocgia'    => ['nullable', 'string', 'max:100'],
            'email'      => ['nullable', 'email', 'max:100'],
        ];

        // Mã SCAC là khóa định danh — chỉ đặt được lúc tạo mới, không đổi được sau đó
        if (!$isUpdate) {
            $rules['mascac'] = ['required', 'string', 'size:4', Rule::unique('hangtau', 'mascac')];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'mascac.required'     => 'Vui lòng nhập mã SCAC.',
            'mascac.size'         => 'Mã SCAC phải đúng 4 ký tự.',
            'mascac.unique'       => 'Mã SCAC này đã tồn tại.',
            'tenhangtau.required' => 'Vui lòng nhập tên hãng tàu.',
            'email.email'         => 'Email không đúng định dạng.',
        ];
    }
}