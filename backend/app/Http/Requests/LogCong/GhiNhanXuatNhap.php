<?php

namespace App\Http\Requests\LogCong;

use Illuminate\Foundation\Http\FormRequest;

class GhiNhanXuatNhap extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'socontainer'   => ['required', 'string', 'exists:container,socontainer'],
            'kieu_xuatnhap' => ['required', 'in:nhap,xuat'],
            'machuyentau'   => ['nullable', 'integer', 'exists:chuyentau,machuyentau'],
            'mataixe'       => ['nullable', 'integer', 'exists:taixe,mataixe'],
            'biensoxe'      => ['nullable', 'string', 'max:20'],
            'niemchi_ktra'  => ['nullable', 'string', 'max:50'],
            'niemchi_ok'    => ['nullable', 'boolean'],
            'haiquan_ok'    => ['nullable', 'boolean'],
            'ghichu'        => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'socontainer.required'   => 'Số container là bắt buộc.',
            'socontainer.exists'     => 'Không tìm thấy container này trong hệ thống.',
            'kieu_xuatnhap.required' => 'Vui lòng chọn nhập hoặc xuất.',
            'kieu_xuatnhap.in'       => 'Kiểu xuất nhập không hợp lệ.',
            'machuyentau.exists'     => 'Chuyến tàu không tồn tại.',
            'mataixe.exists'         => 'Tài xế không tồn tại trong hệ thống.',
        ];
    }
}
