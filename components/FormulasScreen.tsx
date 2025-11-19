import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { SearchIcon } from './icons/SearchIcon';
import { formulasData, searchFormulas, type FormulaItem } from '../data/formulasData';

interface FormulasScreenProps {
  onBack: () => void;
  language: Language;
}

const FormulasScreen: React.FC<FormulasScreenProps> = ({ onBack, language }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = {
    title: language === 'en' ? 'Electrical Formulas' : 'Электрические формулы',
    back: language === 'en' ? 'Back' : 'Назад',
    search: language === 'en' ? 'Search formulas...' : 'Поиск формул...',
    all: language === 'en' ? 'All Formulas' : 'Все формулы',
    favorites: language === 'en' ? 'Favorites' : 'Избранное',
    copy: language === 'en' ? 'Copy' : 'Копировать',
    copied: language === 'en' ? 'Copied!' : 'Скопировано!',
    noFavorites: language === 'en' ? 'No favorites yet' : 'Нет избранных формул',
    noResults: language === 'en' ? 'No formulas found' : 'Формулы не найдены',
  };

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('nec_formula_favorites');
    if (saved) {
      try {
        setFavorites(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('nec_formula_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleFavorite = (formulaId: string) => {
    setFavorites(prev =>
      prev.includes(formulaId)
        ? prev.filter(id => id !== formulaId)
        : [...prev, formulaId]
    );
  };

  const copyFormula = async (formula: FormulaItem) => {
    try {
      await navigator.clipboard.writeText(formula.formula);
      setCopiedId(formula.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Get formulas to display
  const getDisplayFormulas = (): FormulaItem[] => {
    let formulas: FormulaItem[] = [];

    if (searchTerm) {
      formulas = searchFormulas(searchTerm);
    } else if (selectedCategory) {
      const category = formulasData.find(c => c.id === selectedCategory);
      formulas = category?.formulas || [];
    } else if (activeTab === 'favorites') {
      formulas = formulasData
        .flatMap(c => c.formulas)
        .filter(f => favorites.includes(f.id));
    } else {
      formulas = formulasData.flatMap(c => c.formulas);
    }

    return formulas;
  };

  const displayFormulas = getDisplayFormulas();

  // Category grid view
  if (!selectedCategory && !searchTerm && activeTab === 'all') {
    return (
      <motion.div
        className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 pb-24"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={{ left: 0, right: 0.2 }}
        onDragEnd={(_, info) => {
          if (info.offset.x > 100) {
            onBack();
          }
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={onBack}
                className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                {t.back}
              </button>
              <h1 className="text-2xl font-bold ml-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                {t.title}
              </h1>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
              }`}
            >
              {t.all}
            </button>
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                false
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/40 dark:bg-gray-800/40 text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800/60'
              }`}
            >
              ⭐ {t.favorites}
              {favorites.length > 0 && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  {favorites.length}
                </span>
              )}
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Grid */}
          <motion.div 
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
          >
            {formulasData.map((category) => (
              <motion.div
                key={category.id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md hover:scale-105 transition-all"
              >
                <div className="text-4xl mb-3">{category.icon}</div>
                <h3 className="font-bold text-lg mb-2">{category.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {category.description}
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {category.formulas.length} {language === 'en' ? 'formulas' : 'формул'}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Formula list view
  return (
    <motion.div
      className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 pb-24"
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={{ left: 0, right: 0.2 }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 100) {
          if (selectedCategory || searchTerm) {
            setSelectedCategory(null);
            setSearchTerm('');
          } else if (activeTab === 'favorites') {
            setActiveTab('all');
          } else {
            onBack();
          }
        }
      }}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => {
                if (selectedCategory || searchTerm) {
                  setSelectedCategory(null);
                  setSearchTerm('');
                } else if (activeTab === 'favorites') {
                  setActiveTab('all');
                } else {
                  onBack();
                }
              }}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5 mr-2" />
              {t.back}
            </button>
            <h1 className="text-xl font-bold ml-4">
              {selectedCategory
                ? formulasData.find(c => c.id === selectedCategory)?.title
                : searchTerm
                ? `${language === 'en' ? 'Search Results' : 'Результаты поиска'}`
                : t.favorites}
            </h1>
          </div>
        </div>

        {/* Search (in list view) */}
        {!searchTerm && (
          <div className="relative mb-6">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t.search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
        )}

        {/* Formulas List */}
        {displayFormulas.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="text-lg font-medium">
              {activeTab === 'favorites' ? t.noFavorites : t.noResults}
            </p>
          </div>
        ) : (
          <motion.div 
            className="space-y-3"
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
          >
            {displayFormulas.map((formula) => (
              <motion.div
                key={formula.id}
                variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Name and Description */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2">
                      <button
                        onClick={() => toggleFavorite(formula.id)}
                        className="text-xl mt-0.5 flex-shrink-0 hover:scale-110 transition-transform"
                        aria-label="Toggle favorite"
                      >
                        {favorites.includes(formula.id) ? '⭐' : '☆'}
                      </button>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {formula.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {formula.description}
                        </p>
                        {formula.necRef && (
                          <div className="mt-2 inline-flex items-center gap-1 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                            📖 NEC: {formula.necRef}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Formula and Copy */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="font-mono text-base font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-4 py-2 rounded-lg">
                      {formula.formula}
                    </div>
                    <button
                      onClick={() => copyFormula(formula)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      aria-label="Copy formula"
                      title={t.copy}
                    >
                      {copiedId === formula.id ? (
                        <span className="text-green-600 dark:text-green-400 text-sm font-medium">
                          ✓
                        </span>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-600 dark:text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default FormulasScreen;
