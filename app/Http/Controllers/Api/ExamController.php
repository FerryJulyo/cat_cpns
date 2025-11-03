<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ExamController extends Controller
{
    public function start(Request $request)
    {
        $exam = Exam::create([
            'user_id' => $request->user()->id,
            'started_at' => now(),
            'answers' => [],
            'total_questions' => Question::active()->count(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Exam started',
            'data' => [
                'exam_id' => $exam->id,
                'started_at' => $exam->started_at,
            ]
        ], 201);
    }

    public function submit(Request $request)
    {
        $validated = $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'answers' => 'required|array',
            'answers.*' => 'required|integer|min:0|max:3',
        ]);

        $exam = Exam::findOrFail($validated['exam_id']);

        // Verify exam belongs to user
        if ($exam->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Check if already submitted
        if ($exam->finished_at) {
            return response()->json([
                'success' => false,
                'message' => 'Exam already submitted'
            ], 400);
        }

        // Calculate results
        $results = $this->calculateResults($validated['answers']);

        // Update exam
        $exam->update([
            'finished_at' => now(),
            'duration_seconds' => now()->diffInSeconds($exam->started_at),
            'answers' => $validated['answers'],
            'correct_answers' => $results['correct'],
            'percentage' => $results['percentage'],
            'twk_score' => $results['twk']['score'],
            'twk_total' => $results['twk']['total'],
            'tiu_score' => $results['tiu']['score'],
            'tiu_total' => $results['tiu']['total'],
            'tkp_score' => $results['tkp']['score'],
            'tkp_total' => $results['tkp']['total'],
            'passed' => $results['passed'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Exam submitted successfully',
            'data' => [
                'exam_id' => $exam->id,
                'results' => $results,
                'exam' => $exam
            ]
        ], 200);
    }

    private function calculateResults(array $answers)
    {
        $questions = Question::active()->get();
        
        $correct = 0;
        $twkScore = 0;
        $tiuScore = 0;
        $tkpScore = 0;
        $twkTotal = 0;
        $tiuTotal = 0;
        $tkpTotal = 0;

        foreach ($questions as $question) {
            $userAnswer = $answers[$question->id] ?? null;
            
            if ($question->category === 'TWK') {
                $twkTotal++;
                if ($userAnswer === $question->correct_answer) {
                    $twkScore++;
                    $correct++;
                }
            } elseif ($question->category === 'TIU') {
                $tiuTotal++;
                if ($userAnswer === $question->correct_answer) {
                    $tiuScore++;
                    $correct++;
                }
            } elseif ($question->category === 'TKP') {
                $tkpTotal++;
                if ($userAnswer === $question->correct_answer) {
                    $tkpScore++;
                    $correct++;
                }
            }
        }

        $totalQuestions = $questions->count();
        $percentage = $totalQuestions > 0 ? ($correct / $totalQuestions) * 100 : 0;
        $passed = $percentage >= 65;

        return [
            'correct' => $correct,
            'total' => $totalQuestions,
            'percentage' => round($percentage, 2),
            'twk' => ['score' => $twkScore, 'total' => $twkTotal],
            'tiu' => ['score' => $tiuScore, 'total' => $tiuTotal],
            'tkp' => ['score' => $tkpScore, 'total' => $tkpTotal],
            'passed' => $passed
        ];
    }

    public function history(Request $request)
    {
        $exams = Exam::where('user_id', $request->user()->id)
            ->whereNotNull('finished_at')
            ->orderBy('finished_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $exams
        ], 200);
    }

    public function detail(Request $request, $id)
    {
        $exam = Exam::with('user')->findOrFail($id);

        // Verify exam belongs to user
        if ($exam->user_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 403);
        }

        // Get questions with correct answers for review
        $questions = Question::active()->get()->map(function ($question) use ($exam) {
            $userAnswer = $exam->answers[$question->id] ?? null;
            
            return [
                'id' => $question->id,
                'category' => $question->category,
                'question' => $question->question,
                'options' => $question->options,
                'correct_answer' => $question->correct_answer,
                'user_answer' => $userAnswer,
                'is_correct' => $userAnswer === $question->correct_answer,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => [
                'exam' => $exam,
                'questions' => $questions
            ]
        ], 200);
    }
}