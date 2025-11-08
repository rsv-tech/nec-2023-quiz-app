import React, { useState, useEffect } from 'react';
import { type TestResult, type Question, type Choice } from '../types';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import Confetti from './Confetti';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { GoogleGenAI } from '@google/genai';

interface ResultsScreenProps {
  result: TestResult;
  onRestart: () => void;
}

const ResultItem: React.FC<{
  question: Question,
  userAnswer: Choice | null,
  index: number
}> = ({ question, userAnswer, index }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = userAnswer?.is_correct === true;
  const correctAnswer = question.choices.find(c => c.is_correct);

  return (
    <div className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
      <button onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between p-4 text-left">
        <div className="flex items-center">
          {isCorrect ? <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" /> : <CrossIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />}
          <span className="font-medium">Question {index + 1}</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? -90 : 0 }}>
          <ChevronLeftIcon className="h-5 w-5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gray-100/50 dark:bg-gray-800/50">
              <p className="font-semibold mb-2">{question.question_en}</p>
              <p className="text-sm mb-1">Your answer: <span className={isCorrect ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>{userAnswer?.text_en ?? 'Not answered'}</span></p>
              {!isCorrect && <p className="text-sm mb-3">Correct answer: <span className="text-green-600 dark:text-green-400">{correctAnswer?.text_en}</span></p>}
              <p className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-blue-500 pl-2">{question.explanation_en}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GeminiSummary: React.FC<{ questions: Question[], userAnswers: (Choice | null)[] }> = ({ questions, userAnswers }) => {
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerateSummary = async () => {
        setLoading(true);
        setError('');
        setSummary('');

        const wrongQuestions = questions.filter((q, i) => userAnswers[i] && !userAnswers[i]!.is_correct);

        if (wrongQuestions.length === 0) {
            setSummary("Congratulations! You answered all questions correctly. No summary needed.");
            setLoading(false);
            return;
        }

        const prompt = `I am studying for the NEC 2023 exam. I just took a practice test and got the following questions wrong. Please provide a concise summary of the key concepts I should review based on these questions. Focus on the principles behind the correct answers. Format the response using markdown.

Incorrectly Answered Questions:
${wrongQuestions.map((q, i) => `
${i + 1}. Question: "${q.question_en}"
   Correct Answer: "${q.choices.find(c => c.is_correct)?.text_en}"
`).join('')}`;

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
            });
            setSummary(response.text);
        } catch (err) {
            console.error("Gemini API error:", err);
            setError("Sorry, there was an error generating the summary. Please try again.");
        } finally {
            setLoading(false);
        }
    };
    
    return (
        <div className="mt-6 text-left">
            <button
                onClick={handleGenerateSummary}
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 text-lg font-bold text-white bg-purple-600/90 dark:bg-purple-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ios-shadow"
            >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    <span>Generating...</span>
                  </>
                ) : (
                  '✨ Get AI-Powered Summary'
                )}
            </button>
            {error && <p className="mt-4 text-red-500">{error}</p>}
            {summary && (
                <div className="mt-4 p-4 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg prose dark:prose-invert max-w-none">
                  <pre className="whitespace-pre-wrap font-sans text-sm">{summary}</pre>
                </div>
            )}
        </div>
    );
};


const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart }) => {
  const { correct, total, examTitle, questions, userAnswers } = result;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  const [confettiVisible, setConfettiVisible] = useState(percentage >= 90);

  useEffect(() => {
    if (confettiVisible) {
      const timer = setTimeout(() => setConfettiVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [confettiVisible]);

  const getFeedback = () => {
    if (percentage >= 90) return { message: "Excellent!", color: "text-green-500" };
    if (percentage >= 70) return { message: "Great Job!", color: "text-blue-500" };
    if (percentage >= 50) return { message: "Good Effort!", color: "text-yellow-500" };
    return { message: "Keep Practicing!", color: "text-red-500" };
  };

  const feedback = getFeedback();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] text-center relative py-8">
      <div className="sr-only" role="alert" aria-live="polite">
        Test complete. Your score is {percentage} percent. {feedback.message}
      </div>
      
      {confettiVisible && <Confetti />}

      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">Results for</h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{examTitle}</h2>
        
        <div className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center">
            <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle className="text-gray-200 dark:text-gray-700" strokeWidth="8" stroke="currentColor" fill="transparent" r="45" cx="50" cy="50" />
                <motion.circle
                    className={feedback.color}
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 45}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="45"
                    cx="50"
                    cy="50"
                    style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                    initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - percentage / 100) }}
                    transition={{ duration: 1.5, ease: 'easeOut', delay: 0.5 }}
                />
            </svg>
            <div className="absolute flex flex-col">
                <span className={`text-5xl font-bold ${feedback.color}`}>{percentage}%</span>
                <span className="text-lg text-gray-600 dark:text-gray-400">{correct} / {total}</span>
            </div>
        </div>

        <p className={`text-2xl font-semibold mb-6 ${feedback.color}`}>{feedback.message}</p>

        <button
          onClick={onRestart}
          className="w-full py-3 text-lg font-bold text-white bg-blue-600/90 dark:bg-blue-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 ios-shadow"
        >
          Back to Topics
        </button>
      </Card>
      
      <div className="w-full max-w-md mt-8">
        <Card className="p-0">
          <h3 className="text-xl font-bold p-4">Review Your Answers</h3>
          <div className="max-h-96 overflow-y-auto">
            {questions.map((q, i) => (
              <ResultItem key={q.id} question={q} userAnswer={userAnswers[i]} index={i} />
            ))}
          </div>
        </Card>
        <GeminiSummary questions={questions} userAnswers={userAnswers} />
      </div>

    </div>
  );
};

export default ResultsScreen;