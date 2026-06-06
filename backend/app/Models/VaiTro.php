<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VaiTro extends Model
{
    protected $table      = 'vaitro';
    protected $primaryKey = 'mavaitro';

    public $timestamps = false;

    protected $fillable = ['tenvaitro'];

    public function taikhoan()
    {
        return $this->hasMany(User::class, 'mavaitro', 'mavaitro');
    }
}