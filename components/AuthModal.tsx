import React, { useState } from 'react';
import { XIcon, SpinnerIcon } from './Icons';
import Logo from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, name?: string) => Promise<void>;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Basic validation
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }
      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }
      if (mode === 'signup' && !name) {
        throw new Error('Please enter your name');
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // In a real app, this is where you'd call your backend API
      // For this demo, we'll simulate a successful login/signup
      await onLogin(email, mode === 'signup' ? name : undefined);
      
      onClose();
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <Logo className="h-12 w-12 mx-auto mb-3" />
            <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
              {mode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-brand-gray-500 dark:text-brand-gray-400 text-sm mt-1">
              {mode === 'login' ? 'Sign in to continue tracking' : 'Start your journey to better health'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-gold-dark hover:bg-brand-success-dark text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-gold-dark/30"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
              {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-brand-gold-dark dark:text-brand-gold-DEFAULT font-semibold hover:underline focus:outline-none"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;