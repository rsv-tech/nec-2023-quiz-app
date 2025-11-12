import React from 'react';
import { motion } from 'framer-motion';

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Включить hover/tap-анимации (iOS-like) */
  interactive?: boolean;
};

/**
 * Базовая «стеклянная» карточка без каких-либо внутренних контролов.
 * Никаких переключателей языка внутри — только контейнер для контента.
 */
const Card: React.FC<CardProps> = ({ className = '', interactive = true, ...rest }) => {
  const base =
    'rounded-2xl border backdrop-blur-[20px] shadow-lg ' +
    // границы
    'border-black/5 dark:border-white/10 ' +
    // мягкий фон (light/dark)
    'bg-white/80 dark:bg-gray-900/60 ' +
    // текст
    'text-gray-900 dark:text-gray-100';

  const merged = `${base} ${className}`;

  if (interactive) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98, opacity: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        className={merged}
        {...rest}
      />
    );
  }

  return <div className={merged} {...rest} />;
};

export default Card;
