import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getQuestions } from '../services/quizService';
import { getTestState, saveTestState, clearTestState } from '../services/progressService';
import { type Exam, type Question, type Choice, type TestResult, type Language } from '../types';
import { QUESTIONS_PER_TEST, TIME_PER_QUESTION } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

/* =================================================================================
   Глобальный оверлей загрузки результатов (живёт в document.body до ResultsScreen)
   ================================================================================= */
function showGlobalResultsLoader(label: string) {
  const EXISTING_ID = 'results-loader-overlay';
  const existing = document.getElementById(EXISTING_ID);
  if (existing) return () => existing.remove();

  const wrapper = document.createElement('div');
  wrapper.id = EXISTING_ID;
  wrapper.innerHTML = `
    <style>
      @keyframes necResultsBar {
        0% { width: 0%; }
        50% { width: 100%; }
        100% { width: 0%; }
      }
    </style>
    <div class="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/90 dark:bg-gray-900/90">
      <div class="w-full max-w-md px-8">
        <div class="w-full">
          <div class="bg-gray-200/60 dark:bg-gray-700/50 h-3 rounded-full overflow-hidden">
            <div class="h-full bg-gradient-to-r from-blue-500 to-blue-600" style="animation: necResultsBar 1.2s ease-in-out infinite;"></div>
          </div>
        </div>
        <p class="mt-4 text-center text-lg font-semibold text-gray-800 dark:text-gray-100">${label}</p>
      </div>
    </div>
  `;
  document.body.appendChild(wrapper);

  return () => {
    try { wrapper.remove(); } catch {}
  };
}

/* =========================
   Модалка для изображения
   ========================= */
const ImageModal: React.FC<{ imageUrl: string; onClose: () => void }> = ({ imageUrl, onClose }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
  >
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.85, opacity: 0 }}
      onClick={(e) => e.stopPropagation()}
      className="relative"
    >
      <img
        src={imageUrl}
        alt="Full screen view"
        className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl"
        loading="lazy"
      />
    </motion.div>
  </motion.div>
);

/* =========================
   Прогресс-бар времени (желтеет на паузе)
   ========================= */
const ProgressBar: React.FC<{ timeLeft: number; isPaused: boolean }> = ({ timeLeft, isPaused }) => {
  const percentage = Math.max(0, Math.min(100, (timeLeft / TIME_PER_QUESTION) * 100));
  const isWarning = timeLeft < 30;

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(percentage)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Time remaining"
      className="w-full"
    >
      <motion.div
        className={`rounded-full h-2.5 overflow-hidden ${isPaused ? 'bg-yellow-200/70 dark:bg-yellow-900/40' : 'bg-gray-200/50 dark:bg-gray-700/50'}`}
        animate={!isPaused && isWarning ? { backgroundColor: ['#fecaca', '#fee2e2'] } : {}}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className={`h-full ${isPaused ? 'bg-yellow-500' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
          initial={{ width: '100%' }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </motion.div>
      {isPaused && (
        <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1 text-center font-medium">
          Timer paused
        </p>
      )}
    </div>
  );
};

/* =========================
   Карточка вопроса (контролируемая из родителя)
   ========================= */
interface QuestionCardProps {
  question: Question;
  language: Language;
  onAnswer: (choice: Choice) => void;
  selectedChoiceId: string | null;
  onImageClick: (url: string) => void;
  answered: boolean;
  wasCorrect: boolean | null;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  language,
  onAnswer,
  selectedChoiceId,
  onImageClick,
  answered,
  wasCorrect
}) => {
  const handleChoiceClick = (choice: Choice) => {
    if (answered) return;                 // блокируем повторные клики
    onAnswer(choice);
    if (choice.is_correct) navigator.vibrate?.(100);
    else navigator.vibrate?.([200, 100, 200]);
  };

  const choices = question.choices || [];
  const qText =
    language === 'en'
      ? (question.question_en ?? '')
      : (question.question_ru || question.question_en || '');

  const showResult = answered;

  return (
    <Card className="p-8">
      <div className="flex justify-between items-start mb-6">
        <span className="px-4 py-2 bg-red-500/20 text-red-700 dark:text-red-300 rounded-full text-sm font-medium">
          {question.difficulty || 'Medium'}
        </span>
        {question.image_url && (
          <button
            onClick={() => onImageClick(question.image_url!)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            View Image
          </button>
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">{qText}</h2>

      <div className="space-y-4">
        {choices.map((choice) => {
          const isSelected = selectedChoiceId === choice.id;
          const cText =
            language === 'en'
              ? (choice.text_en ?? '')
              : (choice.text_ru || choice.text_en || '');

          return (
            <motion.button
              key={choice.id}
              onClick={() => handleChoiceClick(choice)}
              disabled={showResult}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full text-left p-6 rounded-2xl border-2 transition-all
                ${isSelected
                  ? choice.is_correct
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-red-500 bg-red-500/10'
                  : 'border-gray-300 dark:border-gray-700 hover:border-blue-500'}
                ${showResult && choice.is_correct ? 'ring-4 ring-green-500/30' : ''}
                ${showResult && isSelected && !choice.is_correct ? 'ring-4 ring-red-500/30' : ''}
                ${showResult ? 'cursor-default opacity-95' : ''}
              `}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {choice.id}
                  </span>
                  <span className="text-lg">{cText}</span>
                </div>
                {showResult && choice.is_correct && <CheckIcon className="h-8 w-8 text-green-600" />}
                {showResult && isSelected && !choice.is_correct && <CrossIcon className="h-8 w-8 text-red-600" />}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Пояснение — показываем при ЛЮБОМ ответе */}
      {showResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-8 p-6 rounded-2xl border-2 ${
            wasCorrect ? 'bg-green-500/10 border-green-500/30'
                       : 'bg-yellow-500/10 border-yellow-500/30'
          }`}
        >
          <p
            className={`font-semibold mb-2 ${
              wasCorrect ? 'text-green-700 dark:text-green-300'
                         : 'text-yellow-700 dark:text-yellow-300'
            }`}
          >
            {wasCorrect
              ? (language === 'en' ? 'Correct' : 'Верно')
              : (language === 'en' ? 'Incorrect' : 'Неверно')}
          </p>

          {!wasCorrect && (
            <p className="mb-3">
              <span className="text-sm">
                {language === 'en' ? 'Correct answer: ' : 'Правильный ответ: '}
              </span>
              <span className="text-green-700 dark:text-green-300 font-medium">
                {(() => {
                  const ca = question.choices?.find((c) => c.is_correct);
                  return language === 'en'
                    ? (ca?.text_en ?? '')
                    : (ca?.text_ru || ca?.text_en || '');
                })()}
              </span>
            </p>
          )}

          <p className="leading-relaxed text-gray-800 dark:text-gray-100">
            {language === 'en'
              ? (question.explanation_en || 'Review the NEC section for this topic.')
              : (question.explanation_ru || question.explanation_en || 'Изучите соответствующий раздел NEC.')}
          </p>
        </motion.div>
      )}
    </Card>
  );
};

/* =========================
   Экран теста
   ========================= */
interface TestScreenProps {
  exam: Exam;
  onTestComplete: (result: TestResult) => void;
  onBack: () => void;
}

const TestScreen: React.FC<TestScreenProps> = ({ exam, onTestComplete, onBack }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(Choice | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const [displayLanguage, setDisplayLanguage] = useState<Language>('en');
  const [isPaused, setIsPaused] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Загрузка/восстановление */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const state = getTestState(exam.id);
        if (state && state.questions?.length) {
          setQuestions(state.questions);
          setCurrentQuestionIndex(state.currentIndex ?? 0);
          setUserAnswers(state.userAnswers ?? Array(state.questions.length).fill(null));
          setTimeLeft(state.timeLeft ?? TIME_PER_QUESTION);
        } else {
          const fetched = await getQuestions(exam.id, QUESTIONS_PER_TEST);
          setQuestions(fetched || []);
          setUserAnswers(fetched.length ? Array(fetched.length).fill(null) : []);
        }
      } catch (e) {
        console.error('Failed to load questions:', e);
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as number);
    };
  }, [exam.id]);

  /* Сохранение состояния */
  useEffect(() => {
    if (!loading && questions.length) {
      saveTestState(exam.id, {
        questions,
        currentIndex: currentQuestionIndex,
        userAnswers,
        timeLeft
      });
    }
  }, [exam.id, loading, questions, currentQuestionIndex, userAnswers, timeLeft]);

  /* Таймер */
  useEffect(() => {
    if (loading || questions.length === 0 || isPaused) return;

    if (timeLeft <= 0) {
      // Время вышло — считаем как неверный, блокируем ответы, показываем Next позже
      if (wasCorrect === null) {
        setWasCorrect(false);
        setSelectedChoiceId(''); // без подсветки выбора
        setIsPaused(true);
      }
      return;
    }

    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current as number);
    };
  }, [loading, questions.length, isPaused, timeLeft, wasCorrect]);

  /* Появление Next (разные задержки) */
  useEffect(() => {
    if (wasCorrect === null) return;
    const delay = wasCorrect ? 700 : 1500;
    const t = setTimeout(() => setShowNextButton(true), delay);
    return () => clearTimeout(t);
  }, [wasCorrect]);

  /* Новый вопрос — сброс языка на EN и скрытие Next */
  useEffect(() => {
    setDisplayLanguage('en');
    setShowNextButton(false);
  }, [currentQuestionIndex]);

  /* Ответ */
  const handleAnswer = useCallback(
    (choice: Choice) => {
      if (wasCorrect !== null) return; // блок повторного ответа
      setSelectedChoiceId(choice.id);
      setWasCorrect(choice.is_correct);
      setIsPaused(true);               // при ответе ставим таймер на паузу

      const updated = [...userAnswers];
      updated[currentQuestionIndex] = choice;
      setUserAnswers(updated);
    },
    [currentQuestionIndex, userAnswers, wasCorrect]
  );

  /* Next / View Results */
  const handleNextClick = () => {
    // подготовка к переходу
    setWasCorrect(null);
    setSelectedChoiceId(null);
    setShowNextButton(false);
    setIsPaused(false);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(TIME_PER_QUESTION);
    } else {
      // последний вопрос → запускаем глобальный оверлей и сразу отдаём результат
      const label = displayLanguage === 'en' ? 'Updating results…' : 'Обновляются результаты…';
      const hideOverlay = showGlobalResultsLoader(label);

      clearTestState(exam.id);
      const result: TestResult = {
        correct: userAnswers.filter((a) => a?.is_correct).length,
        total: questions.length,
        examTitle: exam.title,
        questions,
        userAnswers
      };

      onTestComplete(result);

      // Подстраховка: если ResultsScreen не смонтируется, уберём оверлей через 8 сек
      setTimeout(() => { try { hideOverlay(); } catch {} }, 8000);
    }
  };

  const togglePause = () => {
    setIsPaused((p) => !p);
    if (!isPaused) navigator.vibrate?.(50);
  };

  const currentQuestion = questions[currentQuestionIndex];

  /* Экраны загрузки/пусто */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh]">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="mt-6 text-xl">Loading questions...</p>
      </div>
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center px-4">
        <CrossIcon className="h-24 w-24 text-red-500 mb-6" />
        <h2 className="text-2xl font-bold mb-4">No questions available</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          This topic might be under development or temporarily unavailable.
        </p>
        <button
          onClick={onBack}
          className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
        >
          Back to Topics
        </button>
      </div>
    );
  }

  /* Макет */
  return (
    <section className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <AnimatePresence>
        {viewingImageUrl && (
          <ImageModal imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl(null)} />
        )}
      </AnimatePresence>

      {/* HEADER (sticky) */}
      <header
        className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-3
        bg-white/80 dark:bg-gray-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/60
        border-b border-black/5 dark:border-white/10"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onBack}
              className="p-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-gray-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              aria-label="Back to topics"
            >
              <ChevronLeftIcon className="h-6 w-6" />
            </button>

            <div className="text-center flex-1 mx-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{exam.title}</h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                Question {currentQuestionIndex + 1} of {questions.length}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Пауза/плей таймера */}
              <button
                onClick={togglePause}
                className="p-3 rounded-xl bg-white/70 dark:bg-gray-800/60 border border-black/10 dark:border-white/10 hover:bg-white dark:hover:bg-gray-900 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label={isPaused ? 'Resume timer' : 'Pause timer'}
                title={isPaused ? 'Resume timer' : 'Pause timer'}
              >
                {isPaused ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                ) : (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                )}
              </button>

              {/* Переключатель языка (ставит на паузу и НЕ ремоунтит карточку) */}
              <button
                onClick={() => { setDisplayLanguage(prev => (prev === 'en' ? 'ru' : 'en')); setIsPaused(true); }}
                aria-label={`Toggle language to ${displayLanguage === 'en' ? 'Russian' : 'English'}`}
                title={`Language: ${displayLanguage.toUpperCase()}`}
                className="px-3 py-2 text-sm font-bold text-white bg-blue-600/90 dark:bg-blue-500/90 border border-blue-500/20 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition"
              >
                {displayLanguage === 'en' ? 'RU' : 'EN'}
              </button>
            </div>
          </div>

          <div className="mt-3">
            <ProgressBar timeLeft={timeLeft} isPaused={isPaused} />
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 pb-28">
        <div className="max-w-4xl mx-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex} // язык больше не влияет на key → не теряем состояние объяснения
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.98 }}
              transition={{ duration: 0.25 }}
            >
              <QuestionCard
                question={currentQuestion}
                language={displayLanguage}
                onAnswer={handleAnswer}
                selectedChoiceId={selectedChoiceId}
                onImageClick={setViewingImageUrl}
                answered={wasCorrect !== null}
                wasCorrect={wasCorrect}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* FOOTER */}
      <footer
        className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-4
        bg-white/80 dark:bg-gray-900/60 backdrop-blur supports-[backdrop-filter]:bg-white/60
        border-t border-black/5 dark:border-white/10"
      >
        <div className="max-w-4xl mx-auto flex flex-col items-center justify-center gap-2">
          {wasCorrect !== null && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Take a moment to understand why.</p>
          )}

          <AnimatePresence>
            {wasCorrect !== null && showNextButton && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                <button
                  onClick={handleNextClick}
                  className="px-8 py-3 font-semibold text-white bg-blue-600/90 dark:bg-blue-500/90 border border-blue-500/20 rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all"
                >
                  {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'View Results'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </footer>
    </section>
  );
};

export default TestScreen;
