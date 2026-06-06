<?php

namespace App\Http\Requests\LoaiContainer;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuLoaiContainerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // Khi sửa thì bỏ qua unique của chính bản ghi đó
        $maloai = $this->route('loaicontainer')?->maloai;

        return [
            'maiso'          => [
                'required',
                'string',
                'max:4',
                Rule::unique('loaicontainer', 'maiso')->ignore($maloai, 'maloai'),
            ],
            'tenloai'        => ['required', 'string', 'max:100'],
            'chieudai_ft'    => ['required', 'numeric', 'min:1'],
            'chieurong_ft'   => ['required', 'numeric', 'min:1'],
            'chieucao_ft'    => ['required', 'numeric', 'min:1'],
            'taithong_kg'    => ['required', 'numeric', 'min:1'],
            'lalanh'         => ['required', 'boolean'],
            'lahangnguy'     => ['required', 'boolean'],
            'gialuubai_ngay' => ['required', 'numeric', 'min:0'],
            'soNgayMienPhi'  => ['required', 'integer', 'min:0'],
        ];
    }

    public function messages(): array
    {
        return [
            'maiso.required'          => 'Vui lòng nhập mã ISO.',
            'maiso.max'               => 'Mã ISO tối đa 4 ký tự.',
            'maiso.unique'            => 'Mã ISO này đã tồn tại.',
            'tenloai.required'        => 'Vui lòng nhập tên loại container.',
            'chieudai_ft.required'    => 'Vui lòng nhập chiều dài.',
            'chieurong_ft.required'   => 'Vui lòng nhập chiều rộng.',
            'chieucao_ft.required'    => 'Vui lòng nhập chiều cao.',
            'taithong_kg.required'    => 'Vui lòng nhập tải trọng.',
            'lalanh.required'         => 'Vui lòng chọn loại container lạnh.',
            'lahangnguy.required'     => 'Vui lòng chọn loại hàng nguy hiểm.',
            'gialuubai_ngay.required' => 'Vui lòng nhập giá lưu bãi.',
            'gialuubai_ngay.min'      => 'Giá lưu bãi không được âm.',
            'soNgayMienPhi.required'  => 'Vui lòng nhập số ngày miễn phí.',
            'soNgayMienPhi.min'       => 'Số ngày miễn phí không được âm.',
        ];
    }
}