import React, { useState, useEffect, useMemo } from 'react';
import Card from './Card';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchIcon } from './icons/SearchIcon';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { getExams } from '../services/quizService';
import { getProgress } from '../services/progressService';
import { type Exam, type Progress, type User, type Language } from '../types';

interface HomeScreenProps {
  onStartTest: (exam: Exam) => void;
  onStartFullExam: () => void; // New prop
  onOpenGlossary: () => void; // New prop
  user: User | null;
  onUpgradeClick: () => void;
  language: Language;
  onLogout?: () => void;
}

/** ------------ i18n ------------ */
const t = (lang: Language) => ({
  title: 'NEC 2023 Practice',
  subtitle: lang === 'en' ? 'Choose a topic to begin your test.' : 'Выберите тему, чтобы начать тест.',
  trial: (days: number) =>
    lang === 'en' ? `✨ Trial: ${days} day${days !== 1 ? 's' : ''} left` : `✨ Триал: осталось ${days} дн.`,
  freePlan: (used: number, limit: number) =>
    lang === 'en'
      ? `Free Plan: ${used} / ${limit} questions used`
      : `Бесплатный план: ${used} / ${limit} вопросов`,
  upgrade: lang === 'en' ? 'Upgrade to Pro' : 'Перейти на Pro',
  overall: lang === 'en' ? 'Overall Progress' : 'Общий прогресс',
  correctOf: (c: number, total: number) =>
    lang === 'en'
      ? `${c} / ${total} questions answered correctly`
      : `${c} / ${total} вопросов отвечено верно`,
  searchPlaceholder: lang === 'en' ? 'Search topics…' : 'Поиск тем…',
  loading: lang === 'en' ? 'Loading topics...' : 'Загрузка тем...',
  notFoundTitle: lang === 'en' ? 'No topics found' : 'Тем не найдено',
  notFoundHint: lang === 'en' ? 'Try a different search term.' : 'Попробуйте изменить поисковый запрос.',
  start: lang === 'en' ? 'Start Test' : 'Начать',
  correct: lang === 'en' ? 'correct' : 'верно',
  questions: lang === 'en' ? 'questions' : 'вопросов',
  logout: lang === 'en' ? 'Log out' : 'Выйти',
  menu: {
      glossary: lang === 'en' ? 'Glossary' : 'Глоссарий',
      glossaryDesc: lang === 'en' ? 'Key terms and definitions' : 'Основные термины и определения',
      questions: lang === 'en' ? 'Questions' : 'Вопросы',
      questionsDesc: lang === 'en' ? 'Practice by topic' : 'Практика по темам',
      exam: lang === 'en' ? 'Exam Emulation' : 'Эмуляция Экзамена',
      examDesc: lang === 'en' ? '4-hour full simulation' : '4-часовая полная симуляция',
      back: lang === 'en' ? 'Back to Menu' : 'Назад в меню',
  }
});

/** ------------ Категории (жёстко сопоставлены с титулами тем) ------------ */
const categories: { [key: string]: string[] } = {
  'Fundamentals & General Requirements': [
    'Code Structure and Scope',
    'Definitions',
    'General Requirements and Working Space',
  ],
  'Conductors, Raceways & Wiring': [
    'Conductor Ampacity and Corrections',
    'Wiring Methods – General',
    'Raceways',
    'Cable Types',
    'Flexible Cords and Cables',
  ],
  'Protection, Grounding & Boxes': [
    'Boxes, Conduit Bodies and Fittings',
    'Overcurrent Protection',
    'Grounding and Bonding',
    'Surge Protection',
  ],
  'Circuits & Load Calculations': [
    'Branch Circuits',
    'Feeders',
    'Load Calculations – Dwelling',
    'Load Calculations – Non-Dwelling',
    'Voltage Drop',
  ],
  'Services & Equipment': [
    'Services and Service Equipment',
    'Receptacles, Cord-Connectors and GFCI/AFCI',
    'Luminaires and Lighting',
    'Appliances and Fastened-in-Place Equipment',
  ],
  'Specialized Equipment': [
    'Motors, Motor Circuits and Controllers',
    'HVAC and Refrigeration Equipment',
    'Transformers',
    'Generators and Emergency Power',
    'Fire Pumps',
    'Elevators, Escalators and Lifts',
    'Signs and Outline Lighting',
  ],
  'Renewable Energy & High Tech': [
    'Electric Vehicle Charging',
    'Energy Storage Systems',
    'Photovoltaic Systems',
    'Fuel Cell Systems',
  ],
  'Special Occupancies & Conditions': [
    'Hazardous Locations',
    'Health Care Facilities',
    'Swimming Pools, Spas and Fountains',
    'Marinas and Boatyards',
    'Temporary Installations',
  ],
  'Communications & Low Voltage': [
    'Class 1, 2, 3 Remote-Control, Signaling, Power-Limited',
    'Fire Alarm Systems',
    'Optical Fiber Cables',
    'Communications Circuits',
  ],
  'Reference, Tables & Markings': [
    'Short-Circuit and Interrupting Ratings',
    'Selective Coordination',
    'Emergency Disconnects',
    'Box Fill, Conduit Fill, Bending, Chapter 9 Tables',
    'Marking, Labeling and Identification',
  ],
};

/** ------------ Топик-карта ------------ */
const TopicCard: React.FC<{
  exam: Exam;
  progress: Progress;
  onStartTest: (exam: Exam) => void;
  canTakeTest: boolean;
  lang: Language;
}> = ({ exam, progress, onStartTest, canTakeTest, lang }) => {
  const tr = t(lang);
  const examProgress = progress[exam.id];
  const percentage = examProgress ? Math.round((examProgress.correct / exam.num_questions) * 100) : 0;

  const progressColor =
    percentage > 70
      ? 'text-green-500 dark:text-green-400'
      : percentage >= 40
      ? 'text-yellow-500 dark:text-yellow-400'
      : 'text-red-500 dark:text-red-400';

  return (
    <Card className={`p-6 flex flex-col justify-between h-full !backdrop-blur-[20px] bg-gradient-to-br from-white/10 to-transparent ${!canTakeTest ? 'opacity-60' : ''}`}>
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{exam.title}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{exam.description_en}</p>
      </div>

      <div className="flex justify-between items-center mt-4">
        {examProgress ? (
          <div className="flex items-center space-x-2 text-sm font-medium">
            <div className="relative w-9 h-9">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  className="text-gray-200 dark:text-gray-700"
                  strokeWidth="10"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                />
                <motion.circle
                  className={progressColor}
                  strokeWidth="10"
                  strokeDasharray={2 * Math.PI * 45}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="45"
                  cx="50"
                  cy="50"
                  initial={{ strokeDashoffset: 2 * Math.PI * 45 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 45 * (1 - percentage / 100) }}
                  transition={{ duration: 1.3, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.span
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
                  className="text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  {examProgress.correct}
                </motion.span>
              </div>
            </div>
            <span className="text-gray-500 dark:text-gray-400">
              / {exam.num_questions} {tr.correct}
            </span>
          </div>
        ) : (
          <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
            {exam.num_questions} {tr.questions}
          </span>
        )}

        <button
          onClick={() => onStartTest(exam)}
          disabled={!canTakeTest}
          aria-label={`Start test for ${exam.title}`}
          className="px-5 py-2.5 font-semibold text-white bg-blue-600/80 dark:bg-blue-500/80 backdrop-blur-xl border border-blue-500/20 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-300 transform hover:scale-105 ios-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          title={!canTakeTest ? 'Daily limit reached or trial inactive' : undefined}
        >
          {tr.start}
        </button>
      </div>
    </Card>
  );
};

/** ------------ Элемент аккордеона ------------ */
const AccordionItem: React.FC<{
  title: string;
  exams: Exam[];
  progress: Progress;
  onStartTest: (exam: Exam) => void;
  isOpen: boolean;
  onClick: () => void;
  canTakeTest: boolean;
  lang: Language;
}> = ({ title, exams, progress, onStartTest, isOpen, onClick, canTakeTest, lang }) => {
  return (
    <div className="border-b border-white/10">
      <motion.button
        whileHover={{ scale: 1.03 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        onClick={onClick}
        className="w-full flex justify-between items-center p-5 text-left text-xl font-semibold bg-white/10 dark:bg-gray-800/20 hover:bg-white/20 dark:hover:bg-gray-800/40 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
      >
        <span>{title}</span>
        <motion.div animate={{ rotate: isOpen ? 90 : 0 }}>
          <ChevronLeftIcon className="w-5 h-5 transform -rotate-90" />
        </motion.div>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`${title}-content`}
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: 'auto' },
              collapsed: { opacity: 0, height: 0 },
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, mass: 0.5 }}
            className="overflow-hidden"
          >
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-black/5">
              {exams.map((exam) => (
                <TopicCard
                  key={exam.id}
                  exam={exam}
                  progress={progress}
                  onStartTest={onStartTest}
                  canTakeTest={canTakeTest}
                  lang={lang}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/** ------------ Главный экран ------------ */
const HomeScreen: React.FC<HomeScreenProps> = ({
  onStartTest,
  onStartFullExam,
  onOpenGlossary,
  user,
  onUpgradeClick,
  language,
  onLogout,
}) => {
  const tr = t(language);

  const [view, setView] = useState<'menu' | 'topics'>('menu');
  const [exams, setExams] = useState<Exam[]>([]);
  const [progress, setProgress] = useState<Progress>({});
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // ---- триал/дневной лимит
  const { isTrialActive, trialDaysRemaining, questionsUsedToday, dailyLimit, canTakeTest } = useMemo(() => {
    if (!user)
      return { isTrialActive: false, trialDaysRemaining: 0, questionsUsedToday: 0, dailyLimit: 30, canTakeTest: false };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let isTrial = false;
    let left = 0;
    if (user.trialStartDate) {
      const start = new Date(user.trialStartDate);
      const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        isTrial = true;
        left = 7 - diffDays;
      }
    }

    const limit = 30;
    let used = 0;
    if (user.lastQuestionDate) {
      const last = new Date(user.lastQuestionDate);
      const lastDay = new Date(last.getFullYear(), last.getMonth(), last.getDate());
      if (lastDay.getTime() === today.getTime()) used = user.dailyQuestionsAnswered || 0;
    }

    return {
      isTrialActive: isTrial,
      trialDaysRemaining: left,
      questionsUsedToday: used,
      dailyLimit: limit,
      canTakeTest: isTrial || used < limit,
    };
  }, [user]);

  // дебаунс поиска
  useEffect(() => {
    const h = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(h);
  }, [searchTerm]);

  // загрузка экзаменов/прогресса
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        const examsData = await getExams();
        const progressData = getProgress();
        setExams(examsData);
        setProgress(progressData);
      } catch (e) {
        console.error('Failed to load data:', e);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // общий прогресс
  const overall = useMemo(() => {
    const totalPossible = exams.reduce((s, e) => s + e.num_questions, 0);
    const totalCorrect = Object.values(progress).reduce((s, p) => s + p.correct, 0);
    const pct = totalPossible > 0 ? (totalCorrect / totalPossible) * 100 : 0;
    return { totalPossible, totalCorrect, percentage: pct };
  }, [exams, progress]);

  // фильтры/категории
  const filteredExams = useMemo(() => {
    if (!debouncedSearchTerm) return exams;
    const q = debouncedSearchTerm.toLowerCase();
    return exams.filter((e) => e.title.toLowerCase().includes(q));
  }, [exams, debouncedSearchTerm]);

  const categorizedExams = useMemo(() => {
    const map = new Map(filteredExams.map((e) => [e.title, e]));
    return Object.entries(categories)
      .map(([cat, titles]) => ({
        categoryTitle: cat,
        exams: titles.map((t) => map.get(t)).filter((x): x is Exam => Boolean(x)),
      }))
      .filter((c) => c.exams.length > 0);
  }, [filteredExams]);

  useEffect(() => {
    if (searchTerm && categorizedExams.length > 0) {
      setOpenAccordion(categorizedExams[0].categoryTitle);
    } else if (!searchTerm) {
      setOpenAccordion(null);
    }
  }, [searchTerm, categorizedExams]);

  return (
    <div className="space-y-8">
      {/* Верхняя панель: приветствие + Log out */}
      <div className="flex items-center justify-between gap-3 flex-wrap mt-16 md:mt-24">
        <header className="text-left space-y-1">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white">{tr.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">{tr.subtitle}</p>
          {view === 'topics' && (
              <button 
                onClick={() => setView('menu')}
                className="mt-2 text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                  <ChevronLeftIcon className="w-4 h-4" /> {tr.menu.back}
              </button>
          )}
        </header>


      </div>

      {/* Бейджи статуса + Upgrade */}
      <div className="flex justify-center items-center gap-4 flex-wrap">
        <div className="bg-white/20 dark:bg-gray-800/20 backdrop-blur-lg border border-white/10 dark:border-gray-700/30 rounded-full px-4 py-2 text-sm font-semibold">
          {isTrialActive
            ? tr.trial(trialDaysRemaining)
            : tr.freePlan(questionsUsedToday, dailyLimit)}
        </div>
        <button
          onClick={onUpgradeClick}
          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg transform hover:scale-105 transition-transform"
        >
          {tr.upgrade}
        </button>
      </div>

      {/* Main Menu View */}
      {view === 'menu' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mt-4 md:mt-8">
              {/* Glossary */}
              <Card className="p-4 md:p-6 flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer bg-white/40 dark:bg-gray-800/40" onClick={onOpenGlossary}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-2xl md:text-3xl">
                      📚
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{tr.menu.glossary}</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{tr.menu.glossaryDesc}</p>
              </Card>

              {/* Questions */}
              <Card className="p-4 md:p-6 flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer bg-white/40 dark:bg-gray-800/40" onClick={() => setView('topics')}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl md:text-3xl">
                      📝
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{tr.menu.questions}</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{tr.menu.questionsDesc}</p>
              </Card>

              {/* Exam Emulation */}
              <Card className="p-4 md:p-6 flex flex-col items-center text-center hover:scale-105 transition-transform cursor-pointer bg-white/40 dark:bg-gray-800/40" onClick={onStartFullExam}>
                  <div className="w-12 h-12 md:w-16 md:h-16 mb-3 md:mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-2xl md:text-3xl">
                      ⏱️
                  </div>
                  <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">{tr.menu.exam}</h3>
                  <p className="text-sm md:text-base text-gray-600 dark:text-gray-400">{tr.menu.examDesc}</p>
              </Card>
          </div>
      )}

      {/* Topics View (Existing Content) */}
      {view === 'topics' && (
        <>
      {/* Общий прогресс */}
      {!loading && exams.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="p-6 !backdrop-blur-[20px] bg-gradient-to-br from-white/10 to-transparent">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{tr.overall}</h2>
              <span className="font-bold text-blue-500 dark:text-blue-400">
                {Math.round(overall.percentage)}%
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {tr.correctOf(overall.totalCorrect, overall.totalPossible)}
            </p>
            <div
              role="progressbar"
              aria-valuenow={Math.round(overall.percentage)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Overall progress"
              className="w-full bg-gray-200/30 dark:bg-gray-700/50 rounded-full h-2.5"
            >
              <motion.div
                className="bg-blue-500 h-2.5 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${overall.percentage}%` }}
                transition={{ duration: 1.3, ease: 'easeOut' }}
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Поиск */}
      <div className="relative max-w-lg mx-auto">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <SearchIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          placeholder={tr.searchPlaceholder}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none backdrop-blur-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
        />
      </div>

      {/* Контент */}
      {loading ? (
        <div className="text-center py-10">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4">{tr.loading}</p>
        </div>
      ) : (
        <>
          <AnimatePresence>
            {categorizedExams.length > 0 && (
              <motion.div
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-lg overflow-hidden"
              >
                {categorizedExams.map(({ categoryTitle, exams }) => (
                  <AccordionItem
                    key={categoryTitle}
                    title={categoryTitle}
                    exams={exams}
                    progress={progress}
                    onStartTest={onStartTest}
                    isOpen={openAccordion === categoryTitle}
                    onClick={() =>
                      setOpenAccordion(openAccordion === categoryTitle ? null : categoryTitle)
                    }
                    canTakeTest={canTakeTest}
                    lang={language}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {!loading && categorizedExams.length === 0 && debouncedSearchTerm && (
              <motion.div
                className="text-center py-10 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, x: [0, -5, 5, -5, 5, 0] }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ y: { duration: 0.2 }, x: { duration: 0.5, ease: 'easeInOut' } }}
              >
                <SearchIcon className="w-12 h-12 mb-4" />
                <p className="font-semibold text-xl">{t(language).notFoundTitle}</p>
                <p className="mt-1">{t(language).notFoundHint}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
        </>
      )}
    </div>
  );
};

export default HomeScreen;
