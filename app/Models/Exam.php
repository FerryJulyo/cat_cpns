<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exam extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'started_at',
        'finished_at',
        'duration_seconds',
        'answers',
        'total_questions',
        'correct_answers',
        'percentage',
        'twk_score',
        'twk_total',
        'tiu_score',
        'tiu_total',
        'tkp_score',
        'tkp_total',
        'passed',
    ];

    protected $casts = [
        'answers' => 'array',
        'started_at' => 'datetime',
        'finished_at' => 'datetime',
        'passed' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}