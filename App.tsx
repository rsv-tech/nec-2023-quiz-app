import React, { useState } from 'react';
import HomeScreen from './components/HomeScreen';
import TestScreen from './components/TestScreen';
import ResultsScreen from './components/ResultsScreen';
import { type Exam, type TestResult, type Language } from './types';
import useTheme from './hooks/useTheme';
import { saveProgress } from './services/progressService';
import { AnimatePresence, motion } from 'framer-motion';

type Screen = 'home' | 'test' | 'results';

const screenVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const App: React.FC = () => {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [language, setLanguage] = useState<Language>('en');

  useTheme();

  const handleStartTest = (exam: Exam) => {
    setSelectedExam(exam);
    setActiveScreen('test');
  };

  const handleTestComplete = (result: TestResult) => {
    setTestResult(result);
    if (selectedExam) {
      saveProgress(selectedExam.id, { correct: result.correct, total: result.total });
    }
    setActiveScreen('results');
  };

  const handleRestart = () => {
    setSelectedExam(null);
    setTestResult(null);
    setActiveScreen('home');
  };

  const renderScreenComponent = () => {
    switch (activeScreen) {
      case 'test':
        return selectedExam ? (
          <TestScreen
            exam={selectedExam}
            onTestComplete={handleTestComplete}
            onBack={handleRestart}
            language={language}
          />
        ) : null;
      case 'results':
        return testResult ? (
          <ResultsScreen result={testResult} onRestart={handleRestart} />
        ) : null;
      case 'home':
      default:
        return <HomeScreen onStartTest={handleStartTest} />;
    }
  };

  return (
    <main className="min-h-screen text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <div className="container mx-auto p-4 sm:p-6 md:p-8 relative">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-10">
            <button
              onClick={() => setLanguage(lang => (lang === 'en' ? 'ru' : 'en'))}
              className="px-4 py-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-lg border border-white/20 dark:border-gray-700/50 rounded-lg text-sm font-semibold transition-colors hover:bg-white/50 dark:hover:bg-gray-800/50"
            >
              {language === 'en' ? 'RU' : 'EN'}
            </button>
        </div>
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

export default App;
