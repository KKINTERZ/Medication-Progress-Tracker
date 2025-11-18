
import React, { useState, useEffect } from 'react';
import { XIcon, SpinnerIcon } from './Icons';
import Logo from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (email: string, name?: string) => Promise<void>;
  onGoogleLogin: () => void;
  onResetPassword?: (email: string) => Promise<void>;
  initialMode?: 'login' | 'signup';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onGoogleLogin, onResetPassword, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot-password'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Reset state when modal opens or closes
  useEffect(() => {
      if (isOpen) {
          setMode(initialMode);
          setError('');
          setResetSent(false);
          setEmail('');
          setPassword('');
          setName('');
      }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (mode === 'forgot-password') {
          if (!email) {
              throw new Error('Please enter your email address');
          }
          if (onResetPassword) {
              await onResetPassword(email);
          } else {
               // Fallback simulation if prop not provided
               await new Promise(resolve => setTimeout(resolve, 1000));
          }
          setResetSent(true);
          setIsLoading(false);
          return;
      }

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
      if (mode !== 'forgot-password') setIsLoading(false);
    }
  };

  const handleClose = () => {
      onClose();
  };
  
  const switchMode = (newMode: 'login' | 'signup' | 'forgot-password') => {
      setMode(newMode);
      setError('');
      setResetSent(false);
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700 focus:outline-none"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="p-8">
            {mode === 'forgot-password' && resetSent ? (
                <div className="text-center">
                     <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                        <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100 mb-2">Check your email</h2>
                    <p className="text-brand-gray-500 dark:text-brand-gray-400 text-sm mb-6">
                        We've sent password reset instructions to <strong>{email}</strong>.
                    </p>
                    <button
                        onClick={() => switchMode('login')}
                        className="w-full bg-brand-gold-dark hover:bg-brand-success-dark text-white font-medium py-2.5 rounded-lg transition-colors shadow-lg shadow-brand-gold-dark/30"
                    >
                        Back to Log In
                    </button>
                </div>
            ) : (
                <>
                  <div className="text-center mb-6">
                    <Logo className="h-12 w-12 mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-brand-gray-900 dark:text-brand-gray-100">
                      {mode === 'login' ? 'Welcome Back' : (mode === 'signup' ? 'Create Account' : 'Reset Password')}
                    </h2>
                    <p className="text-brand-gray-500 dark:text-brand-gray-400 text-sm mt-1">
                      {mode === 'login' ? 'Sign in to continue tracking' : (mode === 'signup' ? 'Start your journey to better health' : 'Enter your email to receive instructions')}
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

                    {mode !== 'forgot-password' && (
                        <div>
                        <div className="flex justify-between items-center mb-1">
                             <label className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Password</label>
                             {mode === 'login' && (
                                 <button 
                                    type="button"
                                    onClick={() => switchMode('forgot-password')}
                                    className="text-xs text-brand-gold-dark dark:text-brand-gold-DEFAULT hover:underline focus:outline-none"
                                 >
                                     Forgot Password?
                                 </button>
                             )}
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 text-brand-gray-900 dark:text-brand-gray-100 focus:ring-2 focus:ring-brand-gold-DEFAULT focus:border-transparent outline-none transition-all"
                            placeholder="••••••••"
                        />
                        </div>
                    )}

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
                        <span>{mode === 'login' ? 'Sign In' : (mode === 'signup' ? 'Create Account' : 'Send Reset Link')}</span>
                      )}
                    </button>
                  </form>
                
                {mode !== 'forgot-password' && (
                    <div className="mt-6">
                        <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-brand-gray-800 text-brand-gray-500 dark:text-brand-gray-400">Or continue with</span>
                        </div>
                        </div>

                        <button
                        type="button"
                        onClick={() => { onGoogleLogin(); onClose(); }}
                        className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-brand-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-brand-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold-DEFAULT"
                        >
                        <img 
                            src="https://iili.io/fduVidb.png" 
                            alt="Google" 
                            className="w-5 h-5" 
                            onError={(e) => {
                                e.currentTarget.src = "https://www.svgrepo.com/show/475656/google-color.svg";
                            }}
                        />
                        <span className="font-medium">Sign in with Google</span>
                        </button>
                    </div>
                )}

                  <div className="mt-6 text-center">
                      {mode === 'forgot-password' ? (
                           <button
                            onClick={() => switchMode('login')}
                            className="text-sm text-brand-gray-500 dark:text-brand-gray-400 hover:text-brand-gray-900 dark:hover:text-brand-gray-200 font-medium focus:outline-none"
                          >
                            Back to Log In
                          </button>
                      ) : (
                        <p className="text-sm text-brand-gray-500 dark:text-brand-gray-400">
                          {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                          <button
                            onClick={() => switchMode(mode === 'login' ? 'signup' : 'login')}
                            className="text-brand-gold-dark dark:text-brand-gold-DEFAULT font-semibold hover:underline focus:outline-none"
                          >
                            {mode === 'login' ? 'Sign Up' : 'Log In'}
                          </button>
                        </p>
                      )}
                  </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
