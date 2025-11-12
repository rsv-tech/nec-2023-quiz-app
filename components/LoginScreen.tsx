import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from './Card';
import { requestCode, verifyCode, saveUser } from '../services/userService';

interface LoginScreenProps {
  onLoginSuccess: (isNewUser: boolean) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState('');

  // таймер для кнопки повторной отправки кода
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const onCodeChange = (v: string) => {
    const onlyDigits = v.replace(/\D/g, '').slice(0, 6);
    setCode(onlyDigits);
  };

  // шаг 1: запросить код
  const onRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const clean = email.trim().toLowerCase();
    if (!validateEmail(clean)) {
      setError('Please enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await requestCode(clean);
      setStep('code');
      setCooldown(60);
    } catch (err: any) {
      setError(err?.message || 'Failed to send code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // шаг 2: подтвердить код и войти
  const onVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (code.trim().length !== 6) {
      setError('6-digit code required.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyCode(email.trim().toLowerCase(), code.trim());
      saveUser(res.user);
      onLoginSuccess(res.isNewUser);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
    >
      <Card className="w-full max-w-sm p-8 text-center">
        <motion.h1
          layout
          className="text-3xl font-bold text-gray-900 dark:text-white mb-2"
        >
          {step === 'email' ? 'Welcome' : 'Enter the code'}
        </motion.h1>

        <motion.p
          layout
          className="text-gray-600 dark:text-gray-400 mb-6"
        >
          {step === 'email'
            ? 'Enter your email to receive a sign-in code.'
            : `We sent a 6-digit code to ${email || 'your email'}.`}
        </motion.p>

        <form
          onSubmit={step === 'email' ? onRequestCode : onVerify}
          className="space-y-4"
        >
          {step === 'email' ? (
            <>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                disabled={loading}
                className="w-full px-4 py-3 bg-white/50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none backdrop-blur-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="Email address"
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 text-lg font-bold text-white bg-blue-600/90 dark:bg-blue-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ios-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span>Sending code…</span>
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </>
          ) : (
            <>
              <input
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => onCodeChange(e.target.value)}
                placeholder="Enter 6-digit code"
                disabled={loading}
                className="w-full px-4 py-3 tracking-widest text-center text-lg bg-white/50 dark:bg-gray-800/50 border border-transparent dark:border-gray-700/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none backdrop-blur-lg transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                aria-label="One-time code"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="flex-1 flex items-center justify-center py-3 px-4 text-lg font-bold text-white bg-blue-600/90 dark:bg-blue-500/90 backdrop-blur-xl border border-transparent rounded-xl shadow-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ios-shadow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500"
                >
                  {loading ? (
                    <>
                      <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      <span>Signing in…</span>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>

                <button
                  type="button"
                  onClick={onRequestCode}
                  disabled={cooldown > 0 || loading}
                  className="px-4 py-3 text-sm font-semibold text-blue-700 dark:text-blue-300 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-200 dark:border-gray-700 hover:bg-white/80 dark:hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Resend code"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setStep('email')}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline mt-1"
              >
                Change email
              </button>
            </>
          )}
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-500" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
      </Card>
    </motion.div>
  );
};

export default LoginScreen;
