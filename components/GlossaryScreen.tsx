import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, GlossaryItem } from '../types';
import { getGlossaryTerms, addGlossaryTerm } from '../services/glossaryService';

interface GlossaryScreenProps {
  onBack: () => void;
  language: Language;
  onStartQuiz: () => void;
  onLanguageToggle: () => void;
}

type Tab = 'dictionary' | 'flashcards' | 'quiz' | 'media';

const GlossaryScreen: React.FC<GlossaryScreenProps> = ({ onBack, language, onStartQuiz, onLanguageToggle }) => {
  const [activeTab, setActiveTab] = useState<Tab>('dictionary');
  const [searchTerm, setSearchTerm] = useState('');
  const [glossaryData, setGlossaryData] = useState<GlossaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await getGlossaryTerms();
      setGlossaryData(data);
      setLoading(false);
    };
    load();
  }, []);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Term Form State
  const [newTerm, setNewTerm] = useState('');
  const [newDefEn, setNewDefEn] = useState('');
  const [newDefRu, setNewDefRu] = useState('');

  // Flashcard state
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);



  const [isAdding, setIsAdding] = useState(false);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerm) return;

    setIsAdding(true);
    try {
        await addGlossaryTerm(newTerm);
        // Refresh list
        const updated = await getGlossaryTerms();
        setGlossaryData(updated);
        
        setIsAddModalOpen(false);
        setNewTerm('');
        setNewDefEn('');
        setNewDefRu('');
    } catch (error) {
        console.error("Error adding term", error);
    } finally {
        setIsAdding(false);
    }
  };


  const filteredData = glossaryData.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (language === 'en' ? item.definition_en : item.definition_ru).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const t = {
    dictionary: language === 'en' ? 'Dictionary' : 'Словарь',
    flashcards: language === 'en' ? 'Flashcards' : 'Карточки',
    quiz: language === 'en' ? 'Quiz' : 'Квиз',
    media: language === 'en' ? 'Media' : 'Медиа',
    searchPlaceholder: language === 'en' ? 'Search terms...' : 'Поиск терминов...',
    back: language === 'en' ? 'Back' : 'Назад',
    flip: language === 'en' ? 'Tap to flip' : 'Нажми, чтобы перевернуть',
    next: language === 'en' ? 'Next' : 'Далее',
    prev: language === 'en' ? 'Prev' : 'Назад',
    startQuiz: language === 'en' ? 'Start Glossary Quiz' : 'Начать тест по терминам',
    quizDesc: language === 'en' ? 'Test your knowledge with 10 questions based on these terms.' : 'Проверьте свои знания: 10 вопросов по терминам глоссария.',
    mediaTitle: language === 'en' ? 'Learning Resources' : 'Обучающие материалы',
    comingSoon: language === 'en' ? 'Coming soon...' : 'Скоро будет...',
    addTerm: language === 'en' ? 'Add Term' : 'Добавить термин',
    term: language === 'en' ? 'Term' : 'Термин',
    defEn: language === 'en' ? 'Definition (English)' : 'Определение (English)',
    defRu: language === 'en' ? 'Definition (Russian)' : 'Определение (Русский)',
    cancel: language === 'en' ? 'Cancel' : 'Отмена',
    save: language === 'en' ? 'Save' : 'Сохранить',
  };

  const renderTabs = () => (
    <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
      {(['dictionary', 'flashcards', 'quiz', 'media'] as Tab[]).map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
            activeTab === tab
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {t[tab]}
        </button>
      ))}
    </div>
  );

  const renderDictionary = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
          />
          <svg
            className="absolute right-4 top-3.5 h-5 w-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center"
        >
          <svg className="w-5 h-5 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="hidden sm:inline">{t.addTerm}</span>
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredData.map((item, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative group"
          >
            {item.isUserDefined && (
                <span className="absolute top-3 right-3 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-md">
                    User
                </span>
            )}
            <h3 className="text-lg font-bold text-blue-600 dark:text-blue-400 mb-2 pr-8">{item.term}</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {language === 'en' ? item.definition_en : item.definition_ru}
            </p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );

  const renderFlashcards = () => {
    if (glossaryData.length === 0) return null;
    const card = glossaryData[currentCardIndex];
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center min-h-[400px]"
      >
        <div
          className="relative w-full max-w-md h-64 cursor-pointer perspective"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          <motion.div
            className="w-full h-full relative preserve-3d transition-all duration-500"
            animate={{ rotateY: isFlipped ? 180 : 0 }}
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-8 text-center">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white">{card.term}</h3>
              <p className="mt-4 text-sm text-gray-400">{t.flip}</p>
            </div>

            {/* Back */}
            <div
              className="absolute inset-0 backface-hidden bg-blue-600 text-white rounded-2xl shadow-xl flex items-center justify-center p-8 text-center"
              style={{ transform: 'rotateY(180deg)' }}
            >
              <p className="text-lg font-medium leading-relaxed">
                {language === 'en' ? card.definition_en : card.definition_ru}
              </p>
            </div>
          </motion.div>
        </div>

        <div className="flex items-center gap-6 mt-8">
          <button
            onClick={() => {
              setIsFlipped(false);
              setCurrentCardIndex((prev) => (prev === 0 ? glossaryData.length - 1 : prev - 1));
            }}
            className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-gray-500 font-medium">
            {currentCardIndex + 1} / {glossaryData.length}
          </span>
          <button
            onClick={() => {
              setIsFlipped(false);
              setCurrentCardIndex((prev) => (prev === glossaryData.length - 1 ? 0 : prev + 1));
            }}
            className="p-3 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </motion.div>
    );
  };

  const renderQuiz = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 text-center"
    >
      <div className="bg-blue-100 dark:bg-blue-900/30 p-6 rounded-full mb-6">
        <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold mb-2">{t.quiz}</h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">{t.quizDesc}</p>
      <button
        onClick={onStartQuiz}
        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transition-all transform hover:scale-105 active:scale-95"
      >
        {t.startQuiz}
      </button>
    </motion.div>
  );

  const renderMedia = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h3 className="text-xl font-bold mb-4">{t.mediaTitle}</h3>
      
      {/* Video Section */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Videos</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="p-4">
                <h5 className="font-medium mb-1">NEC Basics Part {i}</h5>
                <p className="text-sm text-gray-500">{t.comingSoon}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Podcast Section */}
      <div className="space-y-4 mt-8">
        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Podcasts</h4>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <div>
                <h5 className="font-medium">Electrical Safety Talk #{i}</h5>
                <p className="text-sm text-gray-500">Episode description placeholder</p>
              </div>
              <button className="ml-auto p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          {language === 'en' ? 'Loading glossary...' : 'Загрузка глоссария...'}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t.back}
          </button>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            {t.dictionary}
          </h1>
          <button
            onClick={onLanguageToggle}
            className="px-3 py-1.5 text-sm font-semibold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            {language.toUpperCase()}
          </button>
        </div>

        {renderTabs()}

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dictionary' && renderDictionary()}
            {activeTab === 'flashcards' && renderFlashcards()}
            {activeTab === 'quiz' && renderQuiz()}
            {activeTab === 'media' && renderMedia()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Add Term Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-bold mb-4">{t.addTerm}</h3>
                <form onSubmit={handleAddTerm} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t.term}
                    </label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      required
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-800 dark:text-blue-200">
                    {language === 'en' 
                        ? "Definitions will be automatically generated by AI." 
                        : "Определения будут автоматически сгенерированы ИИ."}
                  </div>
                    <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      disabled={isAdding}
                    >
                      {t.cancel}
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                      disabled={isAdding}
                    >
                      {isAdding ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Generating...
                        </>
                      ) : (
                        t.save
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GlossaryScreen;
