<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // obai đã có 879 dòng thật (vượt tinyint 255) — dùng smallint unsigned
        // (tối đa 65.535), vẫn nhỏ hơn nhiều so với bigint nhưng đủ dư cho cảng thật.
        Schema::table('lichsuvitri', function (Blueprint $table) {
            $table->dropForeign('fk_ls_obai');
        });

        Schema::table('obai', function (Blueprint $table) {
            $table->unsignedSmallInteger('maobai')->autoIncrement()->change();
        });

        Schema::table('lichsuvitri', function (Blueprint $table) {
            $table->unsignedSmallInteger('maobai')->change();

            $table->foreign('maobai', 'fk_ls_obai')
                  ->references('maobai')->on('obai')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }

    public function down(): void
    {
        Schema::table('lichsuvitri', function (Blueprint $table) {
            $table->dropForeign('fk_ls_obai');
        });

        Schema::table('obai', function (Blueprint $table) {
            $table->unsignedBigInteger('maobai')->autoIncrement()->change();
        });

        Schema::table('lichsuvitri', function (Blueprint $table) {
            $table->unsignedBigInteger('maobai')->change();

            $table->foreign('maobai', 'fk_ls_obai')
                  ->references('maobai')->on('obai')
                  ->restrictOnDelete()->cascadeOnUpdate();
        });
    }
};
