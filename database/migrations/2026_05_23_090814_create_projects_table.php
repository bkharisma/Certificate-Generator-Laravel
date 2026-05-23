<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->foreignId('template_id')->constrained()->cascadeOnDelete();
            $table->string('certificate_prefix', 100);
            $table->tinyInteger('certificate_digit_count')->default(3);
            $table->integer('certificate_next_number')->default(1);
            $table->date('certificate_date')->nullable();
            $table->string('title_text', 500)->nullable();
            $table->string('email_subject', 500)->nullable();
            $table->text('email_body')->nullable();
            $table->enum('status', ['draft', 'active', 'completed'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
