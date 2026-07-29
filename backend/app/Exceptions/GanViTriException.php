<?php

namespace App\Exceptions;

use Exception;

// Báo lỗi nghiệp vụ (422) khi kiểm tra điều kiện gán/đảo chuyển vị trí bên trong
// transaction có khóa bản ghi — tách riêng để không lẫn với lỗi hệ thống thật.
class GanViTriException extends Exception
{
}
