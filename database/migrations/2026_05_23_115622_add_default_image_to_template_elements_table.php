<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('template_elements', function (Blueprint $table) {
            $table->string('default_image', 500)->nullable()->after('text_align');
        });
    }

    public function down(): void
    {
        Schema::table('template_elements', function (Blueprint $table) {
            $table->dropColumn('default_image');
        });
    }
};
