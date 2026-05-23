<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('project_signatures', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->foreignId('template_element_id')->constrained()->cascadeOnDelete();
            $table->string('signature_image', 500);
            $table->string('signer_name');
            $table->string('signer_title');
            $table->tinyInteger('sort_order')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('project_signatures');
    }
};
