
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}
    >
      {children}
    </div>
  );
};

export default Card;
