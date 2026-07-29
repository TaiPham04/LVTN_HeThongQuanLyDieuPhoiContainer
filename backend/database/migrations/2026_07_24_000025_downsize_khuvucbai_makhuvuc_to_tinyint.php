<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1 cảng thực tế chỉ có vài chục khu vực bãi là nhiều — bigint (8 byte) quá dư,
        // tinyint unsigned (tối đa 255) là đủ. Chỉ 6 dòng hiện tại nên đổi an toàn.
        Schema::table('obai', function (Blueprint $table) {
            $table->dropForeign('fk_ob_kv');
        });

        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->unsignedTinyInteger('makhuvuc')->autoIncrement()->change();
        });

        Schema::table('obai', function (Blueprint $table) {
            $table->unsignedTinyInteger('makhuvuc')->change();

            $table->foreign('makhuvuc', 'fk_ob_kv')
                  ->references('makhuvuc')->on('khuvucbai')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('obai', function (Blueprint $table) {
            $table->dropForeign('fk_ob_kv');
        });

        Schema::table('khuvucbai', function (Blueprint $table) {
            $table->unsignedBigInteger('makhuvuc')->autoIncrement()->change();
        });

        Schema::table('obai', function (Blueprint $table) {
            $table->unsignedBigInteger('makhuvuc')->change();

            $table->foreign('makhuvuc', 'fk_ob_kv')
                  ->references('makhuvuc')->on('khuvucbai')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
