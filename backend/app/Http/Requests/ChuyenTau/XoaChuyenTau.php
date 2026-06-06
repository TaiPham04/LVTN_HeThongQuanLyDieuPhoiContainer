<?php

namespace App\Http\Requests\ChuyenTau;

use Illuminate\Foundation\Http\FormRequest;

class XoaChuyenTau extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'lydo_xoa'    => ['required', 'string', 'min:10'],
            'xacnhan_xoa' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'lydo_xoa.required'    => 'Vui lòng nhập lý do hủy.',
            'lydo_xoa.min'         => 'Lý do hủy phải có ít nhất 10 ký tự.',
            'xacnhan_xoa.required' => 'Vui lòng nhập chuỗi xác nhận.',
        ];
    }
}
