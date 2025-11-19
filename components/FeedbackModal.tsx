import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { CrossIcon } from './icons/CrossIcon';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedbackType: string, comment: string) => Promise<void>;
  onSuccess?: () => void; // Optional callback for success notification
  language: Language;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, onSubmit, onSuccess, language }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);

  const t = {
    title: language === 'en' ? 'What went wrong? Let me know!' : 'Что-то пошло не так? Дай мне знать!',
    cancel: language === 'en' ? 'Cancel' : 'Отменить',
    submit: language === 'en' ? 'Submit' : 'Отправить',
    other: language === 'en' ? 'Other' : 'Другое',
    placeholder: language === 'en' ? 'Describe the issue...' : 'Опишите проблему...',
    options: [
      { id: 'audio_issue', en: 'Something is wrong with audio', ru: 'Что-то не так с аудио', icon: 'ılı' },
      { id: 'video_issue', en: 'Something is wrong with video', ru: 'Что-то не так с видео', icon: '📹' },
      { id: 'answer_rejected', en: 'My answer is not accepted', ru: 'Мой ответ не принимается', icon: '🧭' },
      { id: 'explanation_unclear', en: 'Explanation is unclear', ru: 'Мне непонятно объяснение', icon: '💬' },
      { id: 'ru_error', en: 'Error in Russian', ru: 'Ошибка в русском', icon: '🇷🇺' },
      { id: 'en_error', en: 'Error in English', ru: 'Ошибка в английском', icon: '🇺🇸' },
    ]
  };

  const handleOptionClick = (optionId: string) => {
    setSelectedOption(optionId);
    setShowCommentInput(false);
  };

  const handleOtherClick = () => {
    setSelectedOption('other');
    setShowCommentInput(true);
  };

  const handleSubmit = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(selectedOption, comment);
      onSuccess?.(); // Show success message
      onClose();
      // Reset state after closing
      setTimeout(() => {
        setSelectedOption(null);
        setComment('');
        setShowCommentInput(false);
        setIsSubmitting(false);
      }, 300);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      setIsSubmitting(false);
    }
  };

  // Auto-submit for predefined options (optional, but user requested "click and done" feel or similar)
  // The user said "I clicked on the feedback icon and I had prepared answers".
  // Usually a confirmation is safer, but let's make it two-step: select -> submit, or select -> auto-submit?
  // The screenshot shows a list. Let's assume selection highlights it, and there is a "Cancel" button at the bottom.
  // But typically you want to submit.
  // Let's make it: Click option -> Submit immediately? Or Click option -> It highlights -> Click Submit?
  // The screenshot has "Cancel" at the bottom. It doesn't show a "Submit" button explicitly, which implies clicking an option might trigger it, OR there's a submit button not shown/scrolled.
  // However, for "Other", we definitely need a submit button.
  // Let's implement: Click option -> If not 'other', submit immediately. If 'other', show input and submit button.
  
  const handleOptionSelect = async (optionId: string) => {
      if (optionId === 'other') {
          handleOtherClick();
      } else {
          setSelectedOption(optionId);
          setIsSubmitting(true);
          try {
            await onSubmit(optionId, '');
            onSuccess?.(); // Show success message
            onClose();
            setTimeout(() => {
                setSelectedOption(null);
                setComment('');
                setShowCommentInput(false);
                setIsSubmitting(false);
            }, 300);
          } catch (error) {
              setIsSubmitting(false);
          }
      }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden pointer-events-auto flex flex-col max-h-[90vh]">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {t.title}
                </h3>
              </div>

              <div className="overflow-y-auto p-2">
                {/* Predefined Options */}
                {!showCommentInput && (
                    <div className="space-y-1">
                    {t.options.map((option) => (
                        <button
                        key={option.id}
                        onClick={() => handleOptionSelect(option.id)}
                        disabled={isSubmitting}
                        className="w-full flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors text-left group"
                        >
                        <span className="text-2xl mr-4 opacity-70 group-hover:opacity-100 transition-opacity">
                            {/* Icons are placeholders, can be replaced with SVGs */}
                            {option.id === 'audio_issue' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                </svg>
                            )}
                            {option.id === 'video_issue' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                            {option.id === 'answer_rejected' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            {option.id === 'explanation_unclear' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                            )}
                            {option.id === 'ru_error' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                </svg>
                            )}
                            {option.id === 'en_error' && (
                                <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                                </svg>
                            )}
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium">
                            {language === 'en' ? option.en : option.ru}
                        </span>
                        </button>
                    ))}
                    
                    <button
                        onClick={handleOtherClick}
                        disabled={isSubmitting}
                        className="w-full flex items-center p-4 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-xl transition-colors text-left group"
                    >
                        <span className="text-2xl mr-4 opacity-70 group-hover:opacity-100 transition-opacity">
                            <svg className="w-6 h-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium">
                            {t.other}
                        </span>
                    </button>
                    </div>
                )}

                {/* Comment Input for "Other" */}
                {showCommentInput && (
                    <div className="p-2">
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={t.placeholder}
                            className="w-full p-4 bg-gray-100 dark:bg-gray-700/50 rounded-xl border-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none text-gray-900 dark:text-white"
                            autoFocus
                        />
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={() => setShowCommentInput(false)}
                                className="flex-1 py-3 font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                {language === 'en' ? 'Back' : 'Назад'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={!comment.trim() || isSubmitting}
                                className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting 
                                    ? (language === 'en' ? 'Sending...' : 'Отправка...') 
                                    : t.submit}
                            </button>
                        </div>
                    </div>
                )}
              </div>

              {!showCommentInput && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                    <button
                    onClick={onClose}
                    className="w-full py-3 font-bold text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
                    >
                    {t.cancel}
                    </button>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
