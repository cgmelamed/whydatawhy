'use client';

import { ChevronRight, Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export default function SuggestedQuestions({ questions, onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b bg-gray-50 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-yellow-500" />
        <h3 className="text-sm font-semibold text-gray-700">Suggested Questions</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {questions.length === 0 ? (
          <p className="text-sm text-gray-500">Upload data to see suggested questions</p>
        ) : (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {question}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}