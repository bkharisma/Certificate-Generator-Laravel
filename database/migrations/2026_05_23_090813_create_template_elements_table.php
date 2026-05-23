<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('template_elements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('template_id')->constrained()->cascadeOnDelete();
            $table->enum('type', ['title', 'recipient_name', 'date', 'certificate_number', 'qr_code', 'signature', 'logo']);
            $table->string('label');
            $table->decimal('x', 8, 2)->default(0);
            $table->decimal('y', 8, 2)->default(0);
            $table->decimal('width', 8, 2)->default(50);
            $table->decimal('height', 8, 2)->default(10);
            $table->integer('font_size')->nullable();
            $table->string('font_family', 100)->nullable();
            $table->string('font_color', 7)->nullable();
            $table->enum('font_style', ['normal', 'bold', 'italic'])->nullable();
            $table->enum('text_align', ['left', 'center', 'right'])->nullable();
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('template_elements');
    }
};
