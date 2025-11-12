import React from 'react';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Включить hover/tap-анимации (iOS-like) */
  interactive?: boolean;
};

/**
 * Унифицированная «стеклянная» карточка для всех экранов.
 * Используется в HomeScreen, TestScreen и ResultsScreen.
 */
const Card: React.FC<CardProps> = ({ className = '', interactive = true, ...rest }) => {
  const base =
    'rounded-2xl backdrop-blur-lg shadow-lg transition-all duration-300 ' +
    // границы — немного ярче
    'border border-white/30 dark:border-gray-700/50 ' +
    // фон — чуть плотнее
    'bg-gradient-to-br from-white/15 to-white/5 dark:from-gray-800/30 dark:to-gray-900/20 ' +
    // текст
    'text-gray-800 dark:text-gray-200 font-sans';

  const merged = `${base} ${className}`;

  // убираем движение — карточка статичная
  return <div className={merged} {...rest} />;
};

export default Card;
