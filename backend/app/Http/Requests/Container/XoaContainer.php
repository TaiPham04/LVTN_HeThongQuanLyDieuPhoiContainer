<?php

namespace App\Http\Requests\Container;

use Illuminate\Foundation\Http\FormRequest;

class XoaContainer extends FormRequest
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
            'lydo_xoa.required'    => 'Vui lòng nhập lý do xóa.',
            'lydo_xoa.min'         => 'Lý do xóa phải có ít nhất 10 ký tự.',
            'xacnhan_xoa.required' => 'Vui lòng nhập chuỗi xác nhận.',
        ];
    }
}
