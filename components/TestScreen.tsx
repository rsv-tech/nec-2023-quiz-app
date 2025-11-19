import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getQuestions } from '../services/quizService';
import { getTestState, saveTestState, clearTestState } from '../services/progressService';
import { type Exam, type Question, type Choice, type TestResult, type Language } from '../types';
import { QUESTIONS_PER_TEST, TIME_PER_QUESTION } from '../constants';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import FeedbackModal from './FeedbackModal';
import { sendFeedback } from '../services/sheetsService';
import { getUser } from '../services/userService';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import Toast from './Toast';

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
  onNext: () => void;
  isLastQuestion: boolean;
  showNextButton: boolean;
  mode: 'practice' | 'exam';
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  language,
  onAnswer,
  selectedChoiceId,
  onImageClick,
  answered,
  wasCorrect,
  onNext,
  isLastQuestion,
  showNextButton,
  mode
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

          const isCorrect = choice.is_correct;

          // Логика оформления
          let buttonClasses = 'w-full text-left p-6 rounded-2xl border-2 transition-all select-none ';
          if (showResult) {
            // После ответа — всё заблокировано
            if (isCorrect) {
              buttonClasses += 'border-green-500 bg-green-500/10 cursor-default';
            } else if (isSelected && !isCorrect) {
              buttonClasses += 'border-red-500 bg-red-500/10 cursor-default';
            } else {
              buttonClasses += 'border-gray-300 dark:border-gray-700 cursor-default opacity-70';
            }
          } else {
            // До ответа
            if (isSelected) {
              buttonClasses += 'border-blue-500 bg-blue-500/10';
            } else {
              buttonClasses += 'border-gray-300 dark:border-gray-700 hover:border-blue-500';
            }
          }

          return (
            <motion.button
              key={choice.id}
              onClick={() => handleChoiceClick(choice)}
              disabled={showResult} // блокировка кликов после ответа
              whileHover={{}} // убираем анимации
              whileTap={{}}   // убираем движения при нажатии
              className={buttonClasses}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    {choice.id}
                  </span>
                  <span className="text-lg">{cText}</span>
                </div>

                {/* Иконки результата — только после ответа */}
                {showResult && isCorrect && (
                  <CheckIcon className="h-8 w-8 text-green-600" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <CrossIcon className="h-8 w-8 text-red-600" />
                )}
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

      {/* Кнопка Next/Finish внутри карточки */}
      <AnimatePresence>
        {(mode === 'exam' || (showResult && showNextButton)) && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="mt-8 flex justify-center"
          >
            <button
              onClick={onNext}
              className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLastQuestion ? 'Finish Exam' : 'Next Question'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
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
  language: Language;
  onLanguageToggle: () => void;
  mode?: 'practice' | 'exam'; // New prop
  initialQuestions?: Question[]; // Optional pre-loaded questions
  timerDuration?: number; // Optional override for timer
}

const TestScreen: React.FC<TestScreenProps> = ({ 
  exam, 
  onTestComplete, 
  onBack, 
  language: initialLanguage, 
  onLanguageToggle,
  mode = 'practice',
  initialQuestions,
  timerDuration
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions || []);
  const [loading, setLoading] = useState(!initialQuestions);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(Choice | null)[]>([]);
  // In exam mode, timer is global. In practice, per question.
  const [timeLeft, setTimeLeft] = useState(timerDuration || (mode === 'exam' ? 14400 : TIME_PER_QUESTION));
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  const [displayLanguage, setDisplayLanguage] = useState<Language>('en');
  const [isPaused, setIsPaused] = useState(false);
  const [wasCorrect, setWasCorrect] = useState<boolean | null>(null);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showNextButton, setShowNextButton] = useState(false);

  const [isDragging, setIsDragging] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  /* Загрузка/восстановление */
  useEffect(() => {
    if (initialQuestions) {
        setLoading(false);
        return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const state = getTestState(exam.id);
        if (state && state.questions?.length) {
          setQuestions(state.questions);
          setCurrentQuestionIndex(state.currentIndex ?? 0);
          setUserAnswers(state.userAnswers ?? Array(state.questions.length).fill(null));
          setTimeLeft(state.timeLeft ?? (mode === 'exam' ? 14400 : TIME_PER_QUESTION));
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
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [exam.id, initialQuestions, mode]);

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
      if (mode === 'exam') {
         // Exam over
         handleFinishExam();
         return;
      }

      // Practice mode: time per question over
      if (wasCorrect === null) {
        setWasCorrect(false);
        setSelectedChoiceId(''); // без подсветки выбора
        setIsPaused(true);
      }
      return;
    }

    timerRef.current = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions.length, isPaused, timeLeft, wasCorrect, mode]);

  /* Появление Next (разные задержки) */
  useEffect(() => {
    if (mode === 'exam') return; // No auto-next button delay in exam mode
    if (wasCorrect === null) return;
    const delay = wasCorrect ? 700 : 1500;
    const t = setTimeout(() => setShowNextButton(true), delay);
    return () => clearTimeout(t);
  }, [wasCorrect, mode]);

  /* Новый вопрос — сброс языка на EN и скрытие Next */
  useEffect(() => {
    // Only reset if not in exam mode (or maybe keep consistent? Let's keep consistent)
    setDisplayLanguage('en');
    setShowNextButton(false);
    // In practice mode, reset timer per question. In exam mode, timer continues.
    if (mode === 'practice') {
        setTimeLeft(TIME_PER_QUESTION);
    }
  }, [currentQuestionIndex, mode]);

  /* Ответ */
  const handleAnswer = useCallback(
    (choice: Choice) => {
      if (mode === 'practice' && wasCorrect !== null) return; // Practice: block if already answered

      // In Exam mode, we just select, we don't show result immediately
      setSelectedChoiceId(choice.id);

      const updated = [...userAnswers];
      updated[currentQuestionIndex] = choice;
      setUserAnswers(updated);

      if (mode === 'practice') {
          setWasCorrect(choice.is_correct);
          setIsPaused(true); // Pause timer in practice
      }
    },
    [currentQuestionIndex, userAnswers, wasCorrect, mode]
  );

  const handleFinishExam = () => {
      const label = displayLanguage === 'en' ? 'Updating results…' : 'Обновляются результаты…';
      const hideOverlay = showGlobalResultsLoader(label);

      clearTestState(exam.id);
      const duration = mode === 'exam'
        ? (14400 - timeLeft)
        : Math.round((Date.now() - (startTimeRef.current || Date.now())) / 1000);

      const result: TestResult = {
        correct: userAnswers.filter((a) => a?.is_correct).length,
        total: questions.length,
        examTitle: exam.title,
        questions,
        userAnswers,
        duration
      };

      onTestComplete(result);

      // Hide overlay immediately when results screen starts loading
      setTimeout(() => { try { hideOverlay(); } catch {} }, 100);
  };

  /* Next / View Results */
  const handleNextClick = () => {
    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex < questions.length) {
      setCurrentQuestionIndex(nextIndex);

      // Restore state for next question if it was already answered
      const nextAnswer = userAnswers[nextIndex];
      setSelectedChoiceId(nextAnswer?.id || null);

      if (mode === 'practice') {
        const isAnswered = !!nextAnswer;
        setWasCorrect(isAnswered ? nextAnswer.is_correct : null);
        setShowNextButton(isAnswered);
        setIsPaused(isAnswered);
      }
    } else {
      handleFinishExam();
    }
  };

  const handlePrevClick = () => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);

      // Restore state for previous question
      const prevAnswer = userAnswers[prevIndex];
      setSelectedChoiceId(prevAnswer?.id || null);

      if (mode === 'practice') {
        const isAnswered = !!prevAnswer;
        setWasCorrect(isAnswered ? prevAnswer.is_correct : null);
        setShowNextButton(isAnswered);
        setIsPaused(isAnswered);
      }
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

  const handleFeedbackSubmit = async (feedbackType: string, comment: string) => {
    const user = getUser();
    const currentQ = questions[currentQuestionIndex];
    
    if (!user || !currentQ) return;

    const questionText = displayLanguage === 'en' 
        ? currentQ.question_en 
        : (currentQ.question_ru || currentQ.question_en);

    await sendFeedback(
        user.userId,
        user.email || '',
        'Question', // Source
        currentQ.id,
        questionText,
        feedbackType,
        comment
    );
  };

  const handleFeedbackSuccess = () => {
    const message = displayLanguage === 'en'
      ? 'Thanks! You just made me a little bit better 🎉'
      : 'Спасибо! Только что я стала чуть лучше благодаря тебе 🎉';
    setFeedbackToast(message);
  };

  if (!questions || questions.length === 0) {
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



  const onDragEnd = (event: any, info: any) => {
    const SWIPE_THRESHOLD = 50;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      // Swipe Left -> Next
      if (mode === 'exam' || wasCorrect !== null) {
         handleNextClick();
      }
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      // Swipe Right -> Prev
      handlePrevClick();
    }
  };

  /* Макет */
  return (
    <div className="min-h-[100dvh] flex flex-col backdrop-blur-lg bg-transparent">

      <AnimatePresence>
        {viewingImageUrl && (
          <ImageModal imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl(null)} />
        )}
      </AnimatePresence>

      {/* HEADER (sticky) */}
        <header
          className="sticky top-0 z-20 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 py-4
          backdrop-blur-[40px] bg-white/30 dark:bg-gray-900/60
          border-b border-white/40 dark:border-gray-700/60
          shadow-[0_4px_20px_rgba(0,0,0,0.25)] backdrop-saturate-150"
        >


        <div className="max-w-4xl mx-auto">
          <div className="w-full max-w-2xl mx-auto px-4 flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          aria-label="Back"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>

        <div className="flex-1 mx-4">
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <button
            onClick={() => setIsFeedbackOpen(true)}
            className="p-2 -mr-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            aria-label="Report issue"
            title="Report an issue with this question"
        >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
            </svg>
        </button>
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
            {mode === 'exam' && (
                <div className="text-center text-sm mt-1 text-gray-600 dark:text-gray-400 font-mono">
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                </div>
            )}
          </div>
      </header>

      {/* CONTENT */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 md:px-8 pb-28 overflow-x-hidden">
        <div className="max-w-4xl mx-auto py-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestionIndex} // язык больше не влияет на key → не теряем состояние объяснения
              initial={{ opacity: 0, x: 40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -40, scale: 0.98 }}
              transition={{ duration: 0.25 }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={onDragEnd}
              className="touch-pan-y"
            >
              <QuestionCard
                question={currentQuestion}
                language={displayLanguage}
                onAnswer={handleAnswer}
                selectedChoiceId={selectedChoiceId}
                onImageClick={setViewingImageUrl}
                answered={mode === 'practice' ? wasCorrect !== null : false} // In exam mode, never show "answered" state (which reveals result)
                wasCorrect={mode === 'practice' ? wasCorrect : null}
                onNext={handleNextClick}
                isLastQuestion={currentQuestionIndex === questions.length - 1}
                showNextButton={showNextButton}
                mode={mode}
              />
            </motion.div>
          </AnimatePresence>
        </div>
        </div>

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        onSubmit={handleFeedbackSubmit}
        onSuccess={handleFeedbackSuccess}
        language={displayLanguage}
      />

      <AnimatePresence>
        {feedbackToast && (
          <Toast
            message={feedbackToast}
            onClose={() => setFeedbackToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TestScreen;
