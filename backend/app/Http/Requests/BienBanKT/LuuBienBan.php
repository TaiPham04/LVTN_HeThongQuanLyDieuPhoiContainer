<?php

namespace App\Http\Requests\BienBanKT;

use Illuminate\Foundation\Http\FormRequest;

class LuuBienBan extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'socontainer'  => ['required', 'string', 'exists:container,socontainer'],
            'loaiktd'      => ['required', 'in:nhapbai,xuatbai,thamdinh,haiquan,dinhky'],
            'chu_ky'       => ['nullable', 'in:hang_thang,hang_quy,hang_nam'],
            'ketqua_ktd'   => ['required', 'string', 'max:2000'],
            'bi_hong'      => ['required', 'boolean'],
            'ketluan'      => ['required', 'in:datieu,khongdat,tamgiu'],
            'thoigian_ktd' => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'socontainer.required'  => 'Số container là bắt buộc.',
            'socontainer.exists'    => 'Không tìm thấy container này trong hệ thống.',
            'loaiktd.required'      => 'Loại kiểm tra là bắt buộc.',
            'loaiktd.in'            => 'Loại kiểm tra không hợp lệ.',
            'ketqua_ktd.required'   => 'Kết quả kiểm tra là bắt buộc.',
            'bi_hong.required'      => 'Vui lòng xác nhận tình trạng hư hỏng.',
            'ketluan.required'      => 'Kết luận là bắt buộc.',
            'thoigian_ktd.required' => 'Thời gian kiểm tra là bắt buộc.',
        ];
    }
}
