import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface ToastProps {
  message: string;
  onDone: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, onDone }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 4000); // Hide after 4 seconds

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 p-4 max-w-sm w-full"
    >
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-xl border border-white/20 dark:border-gray-700/50 rounded-xl shadow-2xl p-4 text-center text-gray-900 dark:text-white font-medium">
        {message}
      </div>
    </motion.div>
  );
};

export default Toast;