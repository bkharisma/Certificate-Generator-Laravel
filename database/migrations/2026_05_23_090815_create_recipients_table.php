<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('recipients', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('certificate_number')->unique();
            $table->string('certificate_path', 500)->nullable();
            $table->enum('status', ['pending', 'generated', 'sent', 'revoked'])->default('pending');
            $table->enum('email_status', ['pending', 'sent', 'failed'])->default('pending');
            $table->timestamp('email_sent_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->string('revoke_reason', 500)->nullable();
            $table->timestamps();

            $table->unique(['project_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('recipients');
    }
};
