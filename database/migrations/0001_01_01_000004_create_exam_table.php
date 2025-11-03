<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('exams', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->integer('duration_seconds')->nullable();
            $table->json('answers'); // {question_id: answer_index}
            $table->integer('total_questions');
            $table->integer('correct_answers')->nullable();
            $table->decimal('percentage', 5, 2)->nullable();
            $table->integer('twk_score')->nullable();
            $table->integer('twk_total')->nullable();
            $table->integer('tiu_score')->nullable();
            $table->integer('tiu_total')->nullable();
            $table->integer('tkp_score')->nullable();
            $table->integer('tkp_total')->nullable();
            $table->boolean('passed')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('exams');
    }
};