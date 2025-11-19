import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import Card from './Card';
import Confetti from './Confetti';
import { CheckIcon } from './icons/CheckIcon';
import { CrossIcon } from './icons/CrossIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ShareIcon } from './icons/ShareIcon';

import { getAttemptHistory } from '../services/sheetsService';
import { type TestResult, type Question, type Choice, type User, type Attempt, type Language } from '../types';

interface ResultsScreenProps {
  result: TestResult;
  onRestart: () => void;
  user: User | null;
  language: Language; // global language from App
}

/* -------------------------
   Helper components
-------------------------- */

const ResultItem: React.FC<{
  question: Question;
  userAnswer: Choice | null;
  index: number;
  language: Language;
}> = ({ question, userAnswer, index, language }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isCorrect = userAnswer?.is_correct === true;
  const correctAnswer = useMemo(
    () => question.choices.find((c) => c.is_correct),
    [question.choices]
  );

  return (
    <div className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0">
      <button
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-label={`Review details for question ${index + 1}`}
        className="w-full flex items-center justify-between p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <div className="flex items-center">
          {isCorrect ? (
            <CheckIcon className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
          ) : (
            <CrossIcon className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
          )}
          <span className="font-medium">
            {language === 'en' ? 'Question' : 'Вопрос'} {index + 1}
          </span>
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
              <p className="font-semibold mb-2">
                {language === 'en' ? question.question_en : question.question_ru}
              </p>

              <p className="text-sm mb-1">
                {language === 'en' ? 'Your answer: ' : 'Ваш ответ: '}
                <span
                  className={
                    isCorrect
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }
                >
                  {userAnswer
                    ? language === 'en'
                      ? userAnswer.text_en
                      : userAnswer.text_ru
                    : language === 'en'
                      ? 'Not answered'
                      : 'Не отвечено'}
                </span>
              </p>

              {!isCorrect && (
                <p className="text-sm mb-3">
                  {language === 'en' ? 'Correct answer: ' : 'Правильный ответ: '}{' '}
                  <span className="text-green-600 dark:text-green-400">
                    {correctAnswer &&
                      (language === 'en'
                        ? correctAnswer.text_en
                        : correctAnswer.text_ru)}
                  </span>
                </p>
              )}

              <p className="text-sm text-gray-600 dark:text-gray-400 border-l-2 border-blue-500 pl-2">
                {language === 'en'
                  ? question.explanation_en
                  : question.explanation_ru}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* -------------------------
   AI summary (optional)
-------------------------- */

const GeminiSummary: React.FC<{
  questions: Question[];
  userAnswers: (Choice | null)[];
  language: Language;
}> = ({ questions, userAnswers, language }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const wrong = useMemo(
    () => questions.filter((q, i) => userAnswers[i] && !userAnswers[i]!.is_correct),
    [questions, userAnswers]
  );

  const canUseAI = Boolean(import.meta.env.VITE_GEMINI_API_KEY);

  const makePrompt = () =>
    language === 'ru'
      ? `Я прошёл практический тест NEC 2023 и допустил ошибки. Составь краткое резюме тем, которые нужно повторить, на русском языке, используя Markdown.`
      : `I completed an NEC 2023 practice test and missed some questions. Write a short English summary of key topics to review, using Markdown.`;

  const formattedWrong = useMemo(
    () =>
      wrong
        .map((q, i) => {
          const correct = q.choices.find((c) => c.is_correct);
          const qText = language === 'ru' ? q.question_ru : q.question_en;
          const aText =
            language === 'ru' ? correct?.text_ru ?? '' : correct?.text_en ?? '';
          return `${i + 1}. **${qText}**\n   ✅ ${aText}`;
        })
        .join('\n'),
    [wrong, language]
  );

  const handleGenerate = async () => {
    setLoading(true);
    setError('');
    setSummary('');

    if (wrong.length === 0) {
      setSummary(
        language === 'en'
          ? 'Congratulations! You answered all questions correctly. 🎉'
          : 'Поздравляем! Все ответы верны. 🎉'
      );
      setLoading(false);
      return;
    }

    if (!canUseAI) {
      // Лёгкий локальный фолбэк без внешнего API
      const local = [
        language === 'en'
          ? 'Review the code article numbers you missed.'
          : 'Повторите номера статей кодекса, где были ошибки.',
        language === 'en'
          ? 'Focus on definition wording vs. practical scenarios.'
          : 'Обратите внимание на формулировки определений и практические сценарии.',
        language === 'en'
          ? 'Re-check conductor sizing, overcurrent protection and grounding basics.'
          : 'Пересмотрите основы выбора сечений, защиты от перегрузок и заземления.'
      ];
      setSummary(
        (language === 'en' ? '### Quick Guidance\n\n' : '### Краткие рекомендации\n\n') +
          local.map((s) => `- ${s}`).join('\n') +
          '\n\n' +
          (language === 'en' ? '### Questions you missed\n\n' : '### Вопросы с ошибками\n\n') +
          formattedWrong
      );
      setLoading(false);
      return;
    }

    // Вызов Gemini REST API напрямую, без SDK
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
        encodeURIComponent(apiKey);

      const body = {
        contents: [
          {
            parts: [{ text: `${makePrompt()}\n\n${formattedWrong}` }]
          }
        ]
      };

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!resp.ok) {
        throw new Error(`Gemini HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ||
        '';

      setSummary(text || '');
    } catch (e) {
      console.error(e);
      setError(
        language === 'en'
          ? 'There was an error generating the summary.'
          : 'Произошла ошибка при генерации резюме.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 text-left">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full flex items-center justify-center py-3 px-4 text-lg font-bold text-white bg-purple-600/90 dark:bg-purple-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-purple-700 dark:hover:bg-purple-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ios-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        {loading ? (
          <>
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            <span>{language === 'en' ? 'Generating…' : 'Генерация…'}</span>
          </>
        ) : summary ? (
          language === 'en' ? '🔄 Regenerate Summary' : '🔄 Создать заново'
        ) : (
          language === 'en' ? '✨ Get AI-Powered Summary' : '✨ Получить AI-резюме'
        )}
      </button>

      {error && <p className="mt-4 text-red-500">{error}</p>}

      {summary && (
        <div className="mt-4 p-4 bg-gray-100/50 dark:bg-gray-900/50 rounded-lg">
          <ReactMarkdown remarkPlugins={[remarkGfm]} className="prose dark:prose-invert max-w-none text-left">
            {summary}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

/* -------------------------
   Main screen
-------------------------- */

const ResultsScreen: React.FC<ResultsScreenProps> = ({ result, onRestart, user, language }) => {
  const { correct, total, examTitle, questions, userAnswers } = result;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  const [confettiVisible, setConfettiVisible] = useState(percentage >= 90);
  const [history, setHistory] = useState<Attempt[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const feedback = useMemo(() => {
    if (percentage >= 90)
      return { text: { en: 'Excellent!', ru: 'Отлично!' }, color: 'text-green-500' };
    if (percentage >= 70)
      return { text: { en: 'Great Job!', ru: 'Хорошая работа!' }, color: 'text-blue-500' };
    if (percentage >= 50)
      return { text: { en: 'Good Effort!', ru: 'Хорошая попытка!' }, color: 'text-yellow-500' };
    return { text: { en: 'Keep Practicing!', ru: 'Продолжайте практиковаться!' }, color: 'text-red-500' };
  }, [percentage]);

  useEffect(() => {
    if (!confettiVisible) return;
    const t = setTimeout(() => setConfettiVisible(false), 5000);
    return () => clearTimeout(t);
  }, [confettiVisible]);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setHistory([]);
        setHistoryLoading(false);
        return;
      }
      setHistoryLoading(true);
      try {
        const data = await getAttemptHistory(user.userId, examTitle);
        setHistory(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load attempt history:', e);
        setHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };
    load();
  }, [user, examTitle]);

  const handleShare = async () => {
    if (!navigator.share) return;
    try {
      await navigator.share({
        title: 'NEC 2023 Practice',
        text:
          language === 'en'
            ? `I scored ${percentage}% on the "${examTitle}" topic!`
            : `Я набрал ${percentage}% по теме "${examTitle}"!`
      });
    } catch (e) {
      // пользователь мог просто отменить — это не ошибка
      console.debug('Share dismissed', e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100dvh-4rem)] text-center relative py-8 pb-24">
      <div className="sr-only" role="alert" aria-live="polite">
        {language === 'en'
          ? `Test complete. Your score is ${percentage} percent. ${feedback.text.en}`
          : `Тест завершен. Ваш результат ${percentage} процентов. ${feedback.text.ru}`}
      </div>

      {confettiVisible && <Confetti numPieces={80} />}

      <Card className="w-full max-w-md p-6 sm:p-8">
        <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {language === 'en' ? 'Results for' : 'Результаты для'}
        </h1>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">{examTitle}</h2>

        <div
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Your final score: ${percentage} percent`}
          className="relative w-48 h-48 mx-auto mb-6 flex items-center justify-center"
        >
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-gray-200 dark:text-gray-700"
              strokeWidth="8"
              stroke="currentColor"
              fill="transparent"
              r="45"
              cx="50"
              cy="50"
            />
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
            <span className="text-lg text-gray-600 dark:text-gray-400">
              {correct} / {total}
            </span>
          </div>
        </div>

        <p className={`text-2xl font-semibold mb-6 ${feedback.color}`}>
          {feedback.text[language]}
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onRestart}
            className="flex-1 py-3 text-lg font-bold text-white bg-blue-600/90 dark:bg-blue-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 ios-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          >
            {language === 'en' ? 'Back to Topics' : 'К темам'}
          </button>

          {'share' in navigator && (
            <button
              onClick={handleShare}
              aria-label="Share your score"
              className="flex-1 sm:flex-none py-3 px-5 text-lg font-bold text-white bg-green-600/90 dark:bg-green-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-green-700 dark:hover:bg-green-600 transition-all duration-300 transform hover:scale-105 ios-shadow flex items-center justify-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            >
              <ShareIcon className="h-5 w-5" />
              <span>{language === 'en' ? 'Share' : 'Поделиться'}</span>
            </button>
          )}
        </div>
      </Card>

      {/* History */}
      <div className="w-full max-w-md mt-8">
        <Card className="p-0">
          <h3 className="text-xl font-bold p-4">
            {language === 'en' ? 'Recent Attempts' : 'Недавние попытки'}
          </h3>

          <div className="max-h-60 overflow-y-auto text-left">
            {historyLoading ? (
              <div className="p-4 text-center text-gray-500">
                {language === 'en' ? 'Loading history…' : 'Загрузка истории…'}
              </div>
            ) : history.length > 0 ? (
              history.map((attempt, idx) => (
                <div
                  key={attempt.attempt_id ?? `${attempt.submitted_at}-${idx}`}
                  className="flex justify-between items-center p-4 border-b border-gray-200/50 dark:border-gray-700/50 last:border-b-0"
                >
                  <div>
                    <p className="font-semibold">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleDateString() : '—'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {attempt.submitted_at ? new Date(attempt.submitted_at).toLocaleTimeString() : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${attempt.passed ? 'text-green-500' : 'text-red-500'}`}>
                      {attempt.score_pct ?? 0}%
                    </span>
                    {attempt.passed ? (
                      <CheckIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <CrossIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="p-4 text-center text-gray-500">
                {language === 'en'
                  ? 'No recent attempts for this topic.'
                  : 'Нет недавних попыток для этой темы.'}
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Review + AI Summary */}
      <div className="w-full max-w-md mt-8">
        <Card className="p-0">
          <h3 className="text-xl font-bold p-4">
            {language === 'en' ? 'Review Your Answers' : 'Просмотр ответов'}
          </h3>
          <div className="max-h-96 overflow-y-auto">
            {questions.map((q, i) => (
              <ResultItem key={q.id} question={q} userAnswer={userAnswers[i]} index={i} language={language} />
            ))}
          </div>
        </Card>

        <GeminiSummary questions={questions} userAnswers={userAnswers} language={language} />
      </div>
    </div>
  );
};

export default ResultsScreen;
