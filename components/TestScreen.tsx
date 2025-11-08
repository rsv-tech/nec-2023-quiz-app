import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getQuestions } from '../services/quizService';
import { type Exam, type Question, type Choice, type TestResult, type Language } from '../types';
import { QUESTIONS_PER_TEST, TIME_PER_QUESTION } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

interface TestScreenProps {
  exam: Exam;
  onTestComplete: (result: TestResult) => void;
  onBack: () => void;
  language: Language;
}

const ProgressBar: React.FC<{ timeLeft: number }> = ({ timeLeft }) => {
    const percentage = (timeLeft / TIME_PER_QUESTION) * 100;
    const isWarning = timeLeft < 30;
    return (
        <motion.div 
            className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2.5 overflow-hidden"
            animate={isWarning ? { scale: [1, 1.02, 1] } : { scale: 1 }}
            transition={isWarning ? { duration: 1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
        >
            <motion.div 
                className={`h-2.5 rounded-full transition-colors duration-500 ${isWarning ? 'bg-red-500' : 'bg-blue-500'}`} 
                initial={{ width: '100%' }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 1, ease: "linear" }}>
            </motion.div>
        </motion.div>
    );
};

const QuestionCard: React.FC<{
    question: Question;
    onAnswer: (choice: Choice) => void;
    selectedChoiceId: string | null;
    language: Language;
}> = ({ question, onAnswer, selectedChoiceId, language }) => {

    const getButtonClass = (choice: Choice) => {
        const base = "w-full text-left p-4 rounded-xl border-2 transition-all duration-300 flex items-center justify-between group transform";
        if (selectedChoiceId === null) {
            return `${base} bg-white/20 dark:bg-gray-700/20 border-transparent hover:scale-[1.02]`;
        }
        
        const isSelected = selectedChoiceId === choice.id;
        const isCorrect = choice.is_correct;
        
        if (isCorrect) {
            return `${base} bg-green-500/30 border-green-500 text-gray-900 dark:text-white font-semibold`;
        }
        if (isSelected && !isCorrect) {
            return `${base} bg-red-500/30 border-red-500 text-gray-900 dark:text-white font-semibold`;
        }
        return `${base} bg-white/10 dark:bg-gray-800/10 border-transparent opacity-60 cursor-not-allowed`;
    };

    const difficultyColors = {
        easy: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        difficult: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };
    const difficultyClass = difficultyColors[question.difficulty];

    return (
        <Card className="p-6 sm:p-8 relative min-h-[450px] flex flex-col">
            <div className="absolute top-4 right-4">
                <span className={`px-3 py-1 text-xs font-semibold rounded-full uppercase ${difficultyClass}`}>
                    {question.difficulty}
                </span>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">
                Question ({language === 'ru' ? 'Русский' : 'English'})
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold mb-6 min-h-[6rem]">
                {language === 'ru' ? question.question_ru : question.question_en}
            </h2>
            <div className="space-y-4">
                {question.choices.map((choice, index) => (
                    <button
                        key={choice.id}
                        onClick={() => onAnswer(choice)}
                        onTouchStart={(e) => e.preventDefault()}
                        disabled={selectedChoiceId !== null}
                        className={getButtonClass(choice)}
                    >
                        <div className="flex items-center">
                            <span className="font-bold mr-3 text-blue-600 dark:text-blue-400">{String.fromCharCode(65 + index)}</span>
                            <span>{language === 'ru' ? choice.text_ru : choice.text_en}</span>
                        </div>
                        {selectedChoiceId !== null && (
                            <>
                                {choice.is_correct && <CheckIcon className="h-6 w-6 text-green-600 dark:text-green-400" />}
                                {selectedChoiceId === choice.id && !choice.is_correct && <CrossIcon className="h-6 w-6 text-red-600 dark:text-red-400" />}
                            </>
                        )}
                    </button>
                ))}
            </div>
        </Card>
    );
};

const TestScreen: React.FC<TestScreenProps> = ({ exam, onTestComplete, onBack, language }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(Choice | null)[]>([]);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  const timerRef = useRef<number | null>(null);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setSelectedChoiceId(null);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      const correctAnswers = userAnswers.filter(answer => answer?.is_correct).length;
      onTestComplete({ 
        correct: correctAnswers, 
        total: questions.length, 
        examTitle: exam.title,
        questions: questions,
        userAnswers: userAnswers,
      });
    }
  }, [currentQuestionIndex, questions, userAnswers, onTestComplete, exam.title]);

  const handleAnswer = useCallback((choice: Choice) => {
    if (selectedChoiceId) return;
    
    if (navigator.vibrate) {
        navigator.vibrate(50); // Haptic feedback
    }

    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = choice;
    setUserAnswers(newAnswers);
    setSelectedChoiceId(choice.id);
    if (timerRef.current) clearInterval(timerRef.current);

    setTimeout(() => {
        handleNextQuestion();
    }, 1500); // Auto-advance after 1.5s
  }, [currentQuestionIndex, selectedChoiceId, userAnswers, handleNextQuestion]);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      const data = await getQuestions(exam.id, QUESTIONS_PER_TEST);
      setQuestions(data);
      setUserAnswers(new Array(data.length).fill(null));
      setLoading(false);
    };
    fetchQuestions();
  }, [exam.id]);
  
  useEffect(() => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (selectedChoiceId === null && !loading && questions.length > 0) {
          timerRef.current = window.setInterval(() => {
              setTimeLeft(prev => {
                  if (prev <= 1) {
                      if(timerRef.current) clearInterval(timerRef.current);
                      const wrongChoice = questions[currentQuestionIndex].choices.find(c => !c.is_correct)!;
                      handleAnswer(wrongChoice);
                      return 0;
                  }
                  return prev - 1;
              });
          }, 1000);
      }
      return () => {
          if (timerRef.current) clearInterval(timerRef.current);
      };
  }, [currentQuestionIndex, selectedChoiceId, loading, questions, handleAnswer]);

  
  if (loading) {
      return (
          <div className="flex flex-col items-center justify-center min-h-[80vh]">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-lg">Preparing your test...</p>
          </div>
      );
  }

  if (questions.length === 0) {
      return (
          <div className="text-center min-h-[80vh] flex flex-col items-center justify-center">
              <h2 className="text-2xl font-bold mb-4">No Questions Found</h2>
              <p className="mb-6">Sorry, we couldn't find any questions for this topic.</p>
              <button onClick={onBack} className="px-6 py-3 font-semibold text-white bg-blue-600/80 dark:bg-blue-500/80 backdrop-blur-md border border-blue-500/20 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500">Back to Topics</button>
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col min-h-[calc(100vh-4rem)]">
        <header className="flex items-center justify-between mb-6">
            <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-500/20 transition-colors"><ChevronLeftIcon className="h-6 w-6" /></button>
            <div className="text-center">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
                <p className="text-gray-600 dark:text-gray-400">Question {currentQuestionIndex + 1} of {questions.length}</p>
            </div>
            <div className="w-10"></div>
        </header>

        <div className="mb-6">
            <ProgressBar timeLeft={timeLeft} />
        </div>
        
        <div className="flex-grow flex items-center justify-center pb-8">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full"
                >
                    <QuestionCard 
                        question={questions[currentQuestionIndex]}
                        onAnswer={handleAnswer}
                        selectedChoiceId={selectedChoiceId}
                        language={language}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    </div>
  );
};


export default TestScreen;
