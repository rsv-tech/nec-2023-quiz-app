import React from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface FormulasScreenProps {
  onBack: () => void;
  language: Language;
}

const FormulasScreen: React.FC<FormulasScreenProps> = ({ onBack, language }) => {
  const t = {
    title: language === 'en' ? 'Electrical Formulas' : 'Электрические формулы',
    back: language === 'en' ? 'Back' : 'Назад',
    ohmsLaw: language === 'en' ? "Ohm's Law" : 'Закон Ома',
    power: language === 'en' ? 'Power Formulas' : 'Формулы мощности',
    voltageDrop: language === 'en' ? 'Voltage Drop' : 'Падение напряжения',
    acCircuits: language === 'en' ? 'AC Circuits' : 'Цепи переменного тока',
  };

  const formulas = [
    {
      category: t.ohmsLaw,
      items: [
        { name: 'Voltage (E)', formula: 'E = I × R', desc: language === 'en' ? 'Volts = Amps × Ohms' : 'Вольты = Амперы × Омы' },
        { name: 'Current (I)', formula: 'I = E / R', desc: language === 'en' ? 'Amps = Volts / Ohms' : 'Амперы = Вольты / Омы' },
        { name: 'Resistance (R)', formula: 'R = E / I', desc: language === 'en' ? 'Ohms = Volts / Amps' : 'Омы = Вольты / Амперы' },
      ],
    },
    {
      category: t.power,
      items: [
        { name: 'Power (P)', formula: 'P = E × I', desc: language === 'en' ? 'Watts = Volts × Amps' : 'Ватты = Вольты × Амперы' },
        { name: 'Power (P)', formula: 'P = I² × R', desc: language === 'en' ? 'Watts = Amps² × Ohms' : 'Ватты = Амперы² × Омы' },
        { name: 'Horsepower (HP)', formula: '1 HP ≈ 746 W', desc: language === 'en' ? 'Mechanical Power' : 'Механическая мощность' },
      ],
    },
    {
      category: t.voltageDrop,
      items: [
        { name: 'Single Phase', formula: 'VD = (2 × K × L × I) / CM', desc: language === 'en' ? 'K=12.9 (Cu), L=Length, I=Amps, CM=Circular Mils' : 'K=12.9 (Медь), L=Длина, I=Ток, CM=Сечение' },
        { name: 'Three Phase', formula: 'VD = (1.732 × K × L × I) / CM', desc: language === 'en' ? 'For 3-phase circuits' : 'Для трехфазных цепей' },
      ],
    },
  ];

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 sm:p-6 pb-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
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

        <div className="grid gap-6 md:grid-cols-2">
          {formulas.map((category, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-100 dark:border-blue-800/30">
                <h2 className="font-bold text-lg text-blue-800 dark:text-blue-300">{category.category}</h2>
              </div>
              <div className="p-4 space-y-4">
                {category.items.map((item, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium text-gray-700 dark:text-gray-300">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</div>
                    </div>
                    <div className="font-mono text-lg font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-1 rounded-lg self-start sm:self-auto">
                      {item.formula}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FormulasScreen;
