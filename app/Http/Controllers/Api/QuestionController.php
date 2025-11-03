<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Question;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function index()
    {
        $questions = Question::active()->get()->map(function ($question) {
            return [
                'id' => $question->id,
                'category' => $question->category,
                'question' => $question->question,
                'options' => $question->options,
                // Don't send correct_answer to frontend
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $questions
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|in:TWK,TIU,TKP',
            'question' => 'required|string',
            'options' => 'required|array|size:4',
            'options.*' => 'required|string',
            'correct_answer' => 'required|integer|min:0|max:3',
        ]);

        $question = Question::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Question created successfully',
            'data' => $question
        ], 201);
    }

    public function update(Request $request, Question $question)
    {
        $validated = $request->validate([
            'category' => 'sometimes|in:TWK,TIU,TKP',
            'question' => 'sometimes|string',
            'options' => 'sometimes|array|size:4',
            'options.*' => 'sometimes|string',
            'correct_answer' => 'sometimes|integer|min:0|max:3',
            'is_active' => 'sometimes|boolean',
        ]);

        $question->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Question updated successfully',
            'data' => $question
        ], 200);
    }

    public function destroy(Question $question)
    {
        $question->delete();

        return response()->json([
            'success' => true,
            'message' => 'Question deleted successfully'
        ], 200);
    }
}