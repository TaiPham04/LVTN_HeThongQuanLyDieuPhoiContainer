<?php

namespace App\Http\Requests\KhuVucBai;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuKhuVucBai extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $makhuvuc = $this->route('khuvucbai')?->makhuvuc;

        return [
            'tenblock'  => [
                'required',
                'string',
                'max:100',
                Rule::unique('khuvucbai', 'tenblock')->ignore($makhuvuc, 'makhuvuc'),
            ],
            'sokhoang'  => ['required', 'integer', 'min:1'],
            'sohang'    => ['required', 'integer', 'min:1'],
            'sotang'    => ['required', 'integer', 'min:1', 'max:10'],
            'loai_nhom' => ['required', Rule::in(['dry','reefer','open_top','flat_rack','platform','hazmat','ventilated'])],
        ];
    }

    public function messages(): array
    {
        return [
            'tenblock.required'   => 'Vui lòng nhập tên khu vực.',
            'tenblock.unique'     => 'Tên khu vực này đã tồn tại.',
            'sokhoang.required'   => 'Vui lòng nhập số khoang.',
            'sokhoang.min'        => 'Số khoang phải lớn hơn 0.',
            'sohang.required'     => 'Vui lòng nhập số hàng.',
            'sohang.min'          => 'Số hàng phải lớn hơn 0.',
            'sotang.required'     => 'Vui lòng nhập số tầng.',
            'sotang.min'          => 'Số tầng phải lớn hơn 0.',
            'sotang.max'          => 'Số tầng tối đa là 10.',
            'loai_nhom.required'  => 'Vui lòng chọn nhóm container cho khu vực này.',
            'loai_nhom.in'        => 'Nhóm container không hợp lệ.',
        ];
    }
}
