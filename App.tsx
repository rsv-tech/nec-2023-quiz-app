import React, { useState, useEffect, Suspense } from 'react';
import LoginScreen from './components/LoginScreen';
import Toast from './components/Toast';
import UpgradeModal from './components/UpgradeModal';
import { type Exam, type TestResult, type User, type Language, type Question } from './types';
import useTheme from './hooks/useTheme';
import { saveProgress } from './services/progressService';
import { recordTestCompletion, saveTestResult } from './services/sheetsService';
import { getUser, saveUser, clearUser } from './services/userService';
import { generateFullExam, generateGlossaryQuiz } from './services/quizService';
import { AnimatePresence, motion } from 'framer-motion';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

// Lazy load for performance
const TestScreen = React.lazy(() => import('./components/TestScreen'));
const HomeScreen = React.lazy(() => import('./components/HomeScreen'));
const ResultsScreen = React.lazy(() => import('./components/ResultsScreen'));
const FormulasScreen = React.lazy(() => import('./components/FormulasScreen'));

type Screen = 'home' | 'test' | 'results' | 'glossary' | 'formulas';

// ... (existing code)

      case 'formulas':
          return (
              <Suspense fallback={<div />}>
                  <FormulasScreen
                    onBack={() => setActiveScreen('home')}
                    language={language}
                  />
              </Suspense>
          );
      case 'home':
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
              onStartFullExam={handleStartFullExam}
              onOpenGlossary={() => setActiveScreen('glossary')}
              onOpenFormulas={() => setActiveScreen('formulas')}
              user={user}
              onUpgradeClick={() => setIsUpgradeModalOpen(true)}
              language={language}
              onLogout={handleLogout}
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
      <main className="min-h-[100dvh] text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
        <div className="container mx-auto p-4 sm:p-6 md:p-8 pb-24 relative">
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
