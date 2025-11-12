import React, { useState, useEffect, Suspense } from 'react';
import LoginScreen from './components/LoginScreen';
import Toast from './components/Toast';
import UpgradeModal from './components/UpgradeModal';
import { type Exam, type TestResult, type User, type Language } from './types';
import useTheme from './hooks/useTheme';
import { saveProgress } from './services/progressService';
import { recordTestCompletion, saveTestResult } from './services/sheetsService';
import { getUser, saveUser, clearUser } from './services/userService';
import { AnimatePresence, motion } from 'framer-motion';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

// Lazy load for performance
const TestScreen = React.lazy(() => import('./components/TestScreen'));
const HomeScreen = React.lazy(() => import('./components/HomeScreen'));
const ResultsScreen = React.lazy(() => import('./components/ResultsScreen'));

type Screen = 'home' | 'test' | 'results';

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [toast, setToast] = useState<{ message: string; key: number } | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Language with localStorage persistence
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nec2023_language');
    return saved === 'ru' || saved === 'en' ? saved : 'en';
  });

  const { theme, toggleTheme } = useTheme();

  // Persist language
  useEffect(() => {
    localStorage.setItem('nec2023_language', language);
  }, [language]);

  // Load user from storage
  useEffect(() => {
    const loggedInUser = getUser();
    if (loggedInUser) setUser(loggedInUser);
  }, []);

  const handleLoginSuccess = (isNewUser: boolean) => {
    const loggedInUser = getUser();
    setUser(loggedInUser);

    const message = isNewUser
      ? (language === 'ru'
          ? 'Добро пожаловать! Ваша 7-дневная пробная версия активирована.'
          : 'Welcome! Your 7-day free trial has started.')
      : (language === 'ru'
          ? `С возвращением, ${loggedInUser?.email}!`
          : `Welcome back, ${loggedInUser?.email}!`);

    setToast({ message, key: Date.now() });
  };

  const handleStartTest = (exam: Exam) => {
    setSelectedExam(exam);
    setActiveScreen('test');
  };

  const handleTestComplete = async (result: TestResult) => {
    const resultWithLanguage = { ...result, language };
    setTestResult(resultWithLanguage);

    if (selectedExam) {
      saveProgress(selectedExam.id, { correct: result.correct, total: result.total });
    }

    if (user && selectedExam) {
      try {
        await Promise.all([
          saveTestResult(user.userId, selectedExam.id, resultWithLanguage),
          recordTestCompletion(user.userId, result.total),
        ]);

        const loggedInUser = getUser();
        if (loggedInUser) {
          const updatedUser: User = {
            ...loggedInUser,
            dailyQuestionsAnswered: (loggedInUser.dailyQuestionsAnswered || 0) + result.total,
            lastQuestionDate: new Date().toISOString(),
          };
          setUser(updatedUser);
          saveUser(updatedUser);
        }
      } catch (error) {
        console.error('Failed to record test completion or save result:', error);
        setToast({
          message: language === 'ru' ? 'Ошибка сохранения результата.' : 'Could not save your results.',
          key: Date.now(),
        });
      }
    }

    setActiveScreen('results');
  };

  const handleRestart = () => {
    setSelectedExam(null);
    setTestResult(null);
    setActiveScreen('home');
  };

  const toggleLanguage = () => {
    const newLang: Language = language === 'en' ? 'ru' : 'en';
    setLanguage(newLang);
    setToast({
      message: newLang === 'ru' ? 'Язык изменён на русский 🇷🇺' : 'Language switched to English 🇺🇸',
      key: Date.now(),
    });
  };

  const handleLogout = () => {
    clearUser();
    setUser(null);
    setSelectedExam(null);
    setTestResult(null);
    setActiveScreen('home');
    setToast({ message: 'Signed out', key: Date.now() });
  };

  // Header controls (hidden on test screen)
  const renderHeaderControls = () => {
    if (activeScreen === 'test') return null;

    return (
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-10 flex items-center gap-2">
        {/* Log out (only when logged in) */}
        {user && (
          <button
            onClick={handleLogout}
            className="px-3 py-2 text-sm font-semibold bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
            aria-label="Log out"
            title="Log out"
          >
            Log out
          </button>
        )}

        {/* Language */}
        <button
          onClick={toggleLanguage}
          className="w-16 h-9 sm:h-10 flex items-center justify-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-lg transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={`Switch to ${language === 'en' ? 'Russian' : 'English'}`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={language}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="font-semibold text-sm"
            >
              {language.toUpperCase()}
            </motion.span>
          </AnimatePresence>
        </button>

        {/* Theme */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-lg transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={theme}
              initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
              animate={{ opacity: 1, rotate: 0, scale: 1 }}
              exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {theme === 'light' ? <MoonIcon className="h-6 w-6" /> : <SunIcon className="h-6 w-6" />}
            </motion.div>
          </AnimatePresence>
        </button>
      </div>
    );
  };

  const renderScreenComponent = () => {
    switch (activeScreen) {
      case 'test':
        return (
          selectedExam && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-6 text-xl">
                    {language === 'ru' ? 'Загрузка теста...' : 'Loading test...'}
                  </p>
                </div>
              }
            >
              <TestScreen
                exam={selectedExam}
                onTestComplete={handleTestComplete}
                onBack={handleRestart}
                language={language}
                onLanguageToggle={toggleLanguage}
              />
            </Suspense>
          )
        );
      case 'results':
        return (
          testResult && (
            <Suspense
              fallback={
                <div className="flex flex-col items-center justify-center min-h-screen">
                  <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <p className="mt-6 text-xl">
                    {language === 'ru' ? 'Загрузка результатов...' : 'Loading results...'}
                  </p>
                </div>
              }
            >
              <ResultsScreen
                result={testResult}
                onRestart={handleRestart}
                user={user}
                language={language}
              />
            </Suspense>
          )
        );
      case 'home':
      default:
        return (
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            }
          >
            <HomeScreen
              onStartTest={handleStartTest}
              user={user}
              onUpgradeClick={() => setIsUpgradeModalOpen(true)}
              language={language}
            />
          </Suspense>
        );
    }
  };

  const renderContent = () => {
    if (!user) {
      return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
    }

    return (
      <main className="min-h-screen text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 relative">
          {renderHeaderControls()}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              variants={screenVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              {renderScreenComponent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    );
  };

  return (
    <>
      {renderContent()}
      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
      <AnimatePresence>
        {toast && <Toast key={toast.key} message={toast.message} onDone={() => setToast(null)} />}
      </AnimatePresence>
    </>
  );
};


export default App;
