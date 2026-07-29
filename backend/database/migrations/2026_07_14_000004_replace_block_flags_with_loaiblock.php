<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->enum('loaiblock', ['thuong', 'lanh', 'hangnguy'])
                  ->default('thuong')
                  ->after('sotang');
        });

        // Data migration từ flags cũ
        DB::table('khuvucbai')->where('lablock_lanh', true)->update(['loaiblock' => 'lanh']);
        DB::table('khuvucbai')->where('lablock_hangnguy', true)->update(['loaiblock' => 'hangnguy']);

        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->dropColumn(['lablock_lanh', 'lablock_hangnguy', 'soocamlanh']);
        });
    }

    public function down(): void
    {
        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->boolean('lablock_lanh')->default(false)->after('sotang');
            $table->boolean('lablock_hangnguy')->default(false)->after('lablock_lanh');
            $table->integer('soocamlanh')->default(0)->after('lablock_hangnguy');
        });

        DB::table('khuvucbai')->where('loaiblock', 'lanh')->update(['lablock_lanh' => true]);
        DB::table('khuvucbai')->where('loaiblock', 'hangnguy')->update(['lablock_hangnguy' => true]);

        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->dropColumn('loaiblock');
        });
    }
};
