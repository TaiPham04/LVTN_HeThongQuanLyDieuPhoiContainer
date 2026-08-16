<?php

namespace App\Exceptions;

use Exception;

// Báo lỗi nghiệp vụ (422) khi kiểm tra điều kiện ghi nhận xuất/nhập cổng bên trong
// transaction có khóa bản ghi — tách riêng để không lẫn với lỗi hệ thống thật.
class LogCongException extends Exception
{
}
