'use client';

import { ChevronRight, Sparkles } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onQuestionClick: (question: string) => void;
}

export default function SuggestedQuestions({ questions, onQuestionClick }: SuggestedQuestionsProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Sparkles className="w-3 h-3 text-gray-400" />
        <h3 className="text-xs font-light text-gray-600 tracking-wider uppercase">Suggested Questions</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {questions.length === 0 ? (
          <p className="text-sm text-gray-400 font-light">Upload data to see suggested questions</p>
        ) : (
          <div className="space-y-2">
            {questions.map((question, index) => (
              <button
                key={index}
                onClick={() => onQuestionClick(question)}
                className="w-full text-left p-3 rounded-lg border border-gray-100 hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <div className="flex items-start gap-2">
                  <ChevronRight className="w-3 h-3 text-gray-300 group-hover:text-gray-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 font-light leading-relaxed group-hover:text-gray-900">
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