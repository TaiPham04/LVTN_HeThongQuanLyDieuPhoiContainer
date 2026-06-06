<?php

namespace App\Http\Requests\ChuyenTau;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LuuChuyenTau extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        $machuyentau = $this->route('chuyentau')?->machuyentau;

        return [
            'mahangtau'         => ['required', 'exists:hangtau,mahangtau'],
            'tentau'            => ['required', 'string', 'max:255'],
            'sovoyage'          => ['required', 'string', 'max:50',
                                    Rule::unique('chuyentau', 'sovoyage')->ignore($machuyentau, 'machuyentau')],
            'cangxuatphat'      => ['required', 'string', 'max:5'],
            'cangdich'          => ['required', 'string', 'max:5'],
            'thoigiandukien'    => ['required', 'date'],
            'thoigianroiben'    => ['required', 'date', 'after:thoigiandukien'],
            'socontainerdukien' => ['nullable', 'integer', 'min:1'],
        ];
    }

    public function messages(): array
    {
        return [
            'mahangtau.required'      => 'Vui lòng chọn hãng tàu.',
            'mahangtau.exists'        => 'Hãng tàu không tồn tại.',
            'tentau.required'         => 'Vui lòng nhập tên tàu.',
            'sovoyage.required'       => 'Vui lòng nhập số voyage.',
            'sovoyage.unique'         => 'Số voyage này đã tồn tại.',
            'cangxuatphat.required'   => 'Vui lòng nhập cảng xuất phát.',
            'cangdich.required'       => 'Vui lòng nhập cảng đích.',
            'thoigiandukien.required' => 'Vui lòng nhập thời gian dự kiến đến.',
            'thoigianroiben.required' => 'Vui lòng nhập thời gian rời bến.',
            'thoigianroiben.after'    => 'Thời gian rời bến phải sau thời gian đến.',
        ];
    }
}
