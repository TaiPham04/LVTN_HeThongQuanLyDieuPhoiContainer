<?php

namespace App\Http\Requests\Container;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuContainer extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $macontainer = $this->route('container')?->macontainer;

        return [
            'socontainer'   => ['required', 'string', 'max:11', 'regex:/^[A-Z]{4}[0-9]{7}$/',
                                Rule::unique('container', 'socontainer')->ignore($macontainer, 'macontainer')->whereNull('deleted_at')],
            'maloai'        => ['required', 'exists:loaicontainer,maloai'],
            'mahangtau'     => ['required', 'exists:hangtau,mahangtau'],
            'machuyentau'   => ['nullable', 'exists:chuyentau,machuyentau'],
            'soniemchi'     => ['nullable', 'string', 'max:50'],
            'trongluong_kg' => ['nullable', 'numeric', 'min:0', 'max:99999.99'],
            'mota_hanghoa'  => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'socontainer.required' => 'Vui lòng nhập số container.',
            'socontainer.regex'    => 'Số container phải có định dạng 4 chữ hoa + 7 số (VD: MSCU1234567).',
            'socontainer.unique'   => 'Số container này đã tồn tại trong hệ thống.',
            'maloai.required'      => 'Vui lòng chọn loại container.',
            'maloai.exists'        => 'Loại container không hợp lệ.',
            'mahangtau.required'   => 'Vui lòng chọn hãng tàu.',
            'mahangtau.exists'     => 'Hãng tàu không hợp lệ.',
            'machuyentau.exists'   => 'Chuyến tàu không hợp lệ.',
            'trongluong_kg.numeric' => 'Trọng lượng phải là số.',
            'trongluong_kg.min'    => 'Trọng lượng không được âm.',
        ];
    }
}
