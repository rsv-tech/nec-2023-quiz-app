import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <Card className="p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Upgrade to Pro</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Unlock unlimited questions, detailed analytics, and all future features.
              </p>
              
              <div className="space-y-4 mb-8">
                <div className="p-4 border-2 border-purple-500 rounded-xl bg-purple-500/10 text-left">
                  <h3 className="font-bold text-lg">Pro Monthly</h3>
                  <p className="text-gray-700 dark:text-gray-300">$9.99 / month</p>
                </div>
                 <div className="p-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl text-left">
                  <h3 className="font-bold text-lg">Pro Annually</h3>
                  <p className="text-gray-700 dark:text-gray-300">$99.99 / year (Save 20%)</p>
                </div>
              </div>

              <button
                onClick={() => alert("Upgrade feature coming soon!")}
                className="w-full py-3 text-lg font-bold text-white bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg transform hover:scale-105 transition-transform"
              >
                Choose Plan
              </button>
               <button
                onClick={onClose}
                className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                Maybe later
              </button>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpgradeModal;