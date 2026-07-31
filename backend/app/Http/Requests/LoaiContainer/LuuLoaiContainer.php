<?php

namespace App\Http\Requests\LoaiContainer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuLoaiContainer extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $isUpdate = (bool) $this->route('loaicontainer');

        $rules = [
            'nhom'           => ['required', Rule::in(['dry','reefer','open_top','flat_rack','platform','hazmat','ventilated'])],
            'tenloai'        => ['required', 'string', 'max:100'],
            'chieudai_ft'    => ['required', 'numeric', 'min:1'],
            'chieurong_ft'   => ['required', 'numeric', 'min:1'],
            'chieucao_ft'    => ['required', 'numeric', 'min:1'],
            'taitrong_kg'    => ['required', 'numeric', 'min:1'],
            'gialuubai_ngay'     => ['required', 'numeric', 'min:0'],
            'soNgayMienPhi'      => ['required', 'integer', 'min:0'],
        ];

        // Mã ISO là khóa định danh — chỉ đặt được lúc tạo mới, không đổi được sau đó
        if (!$isUpdate) {
            $rules['maiso'] = ['required', 'string', 'max:4', Rule::unique('loaicontainer', 'maiso')];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'maiso.required'          => 'Vui lòng nhập mã ISO.',
            'maiso.max'               => 'Mã ISO tối đa 4 ký tự.',
            'maiso.unique'            => 'Mã ISO này đã tồn tại.',
            'nhom.required'           => 'Vui lòng chọn nhóm container.',
            'nhom.in'                 => 'Nhóm container không hợp lệ.',
            'tenloai.required'        => 'Vui lòng nhập tên loại container.',
            'chieudai_ft.required'    => 'Vui lòng nhập chiều dài.',
            'chieurong_ft.required'   => 'Vui lòng nhập chiều rộng.',
            'chieucao_ft.required'    => 'Vui lòng nhập chiều cao.',
            'taitrong_kg.required'    => 'Vui lòng nhập tải trọng.',
            'gialuubai_ngay.required' => 'Vui lòng nhập giá lưu bãi.',
            'gialuubai_ngay.min'      => 'Giá lưu bãi không được âm.',
            'soNgayMienPhi.required'  => 'Vui lòng nhập số ngày miễn phí.',
            'soNgayMienPhi.min'       => 'Số ngày miễn phí không được âm.',
        ];
    }
}