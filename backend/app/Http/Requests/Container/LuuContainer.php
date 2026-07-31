<?php

namespace App\Http\Requests\Container;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuContainer extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $isUpdate = (bool) $this->route('container');

        $rules = [
            'loai_hinh'     => ['required', 'in:nhap,xuat'],
            'maloai'        => ['required', 'exists:loaicontainer,maloai'],
            'machuyentau'   => ['required', 'exists:chuyentau,machuyentau'],
            'soniemchi'     => ['nullable', 'string', 'max:50'],
            'trongluong_kg' => ['nullable', 'numeric', 'min:0', 'max:99999.99'],
            'mota_hanghoa'  => ['nullable', 'string', 'max:1000'],
        ];

        // Số container là khóa định danh — chỉ đặt được lúc tạo mới, không đổi được sau đó
        if (!$isUpdate) {
            $rules['socontainer'] = ['required', 'string', 'max:11', 'regex:/^[A-Z]{4}[0-9]{7}$/',
                                      Rule::unique('container', 'socontainer')->whereNull('deleted_at')];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'socontainer.required'  => 'Vui lòng nhập số container.',
            'socontainer.regex'     => 'Số container phải có định dạng 4 chữ hoa + 7 số (VD: MSCU1234567).',
            'socontainer.unique'    => 'Số container này đã tồn tại trong hệ thống.',
            'loai_hinh.required'    => 'Vui lòng chọn loại hình (nhập/xuất).',
            'loai_hinh.in'          => 'Loại hình không hợp lệ.',
            'maloai.required'       => 'Vui lòng chọn loại container.',
            'maloai.exists'         => 'Loại container không hợp lệ.',
            'machuyentau.required'  => 'Vui lòng chọn chuyến tàu.',
            'machuyentau.exists'    => 'Chuyến tàu không hợp lệ.',
            'trongluong_kg.numeric' => 'Trọng lượng phải là số.',
            'trongluong_kg.min'     => 'Trọng lượng không được âm.',
        ];
    }
}
