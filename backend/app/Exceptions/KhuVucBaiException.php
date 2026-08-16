<?php

namespace App\Exceptions;

use Exception;

// Báo lỗi nghiệp vụ (422) khi kiểm tra điều kiện thay đổi khu vực bãi bên trong
// transaction có khóa bản ghi — tách riêng để không lẫn với lỗi hệ thống thật.
class KhuVucBaiException extends Exception
{
}
