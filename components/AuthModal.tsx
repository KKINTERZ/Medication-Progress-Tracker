import React, { useState } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { UserProfile } from '../types';
import { XIcon } from './Icons';

interface AuthModalProps {
  mode: 'login' | 'signup';
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
}

type StoredUser = UserProfile & { passwordHash: string };

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onAuthSuccess }) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [users, setUsers] = useLocalStorage<StoredUser[]>('users_db', []);

  const title = currentMode === 'login' ? 'Log In' : 'Create Account';
  const buttonText = currentMode === 'login' ? 'Log In' : 'Sign Up';
  const switchText = currentMode === 'login' ? "Don't have an account?" : 'Already have an account?';
  const switchActionText = currentMode === 'login' ? 'Sign Up' : 'Log In';

  const switchMode = () => {
    setCurrentMode(currentMode === 'login' ? 'signup' : 'login');
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password cannot be empty.');
      return;
    }
    setError('');
    setIsLoading(true);

    // Simulate async operation
    setTimeout(() => {
      if (currentMode === 'signup') {
        const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
          setError('An account with this email already exists.');
          setIsLoading(false);
          return;
        }
        const newUser: StoredUser = {
          id: crypto.randomUUID(),
          email: email.toLowerCase(),
          name: email.split('@')[0], // Default name from email
          passwordHash: password, // In a real app, hash this password!
        };
        setUsers(prevUsers => [...prevUsers, newUser]);
        const { passwordHash, ...userProfile } = newUser;
        onAuthSuccess(userProfile);
      } else { // Login mode
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user && user.passwordHash === password) { // In a real app, compare hashes!
          const { passwordHash, ...userProfile } = user;
          onAuthSuccess(userProfile);
        } else {
          setError('Invalid email or password.');
          setIsLoading(false);
        }
      }
    }, 500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-sm bg-white dark:bg-brand-gray-800 rounded-xl shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center p-5 border-b border-brand-gray-200 dark:border-brand-gray-700">
          <h2 className="text-xl font-bold text-brand-gray-900 dark:text-brand-gray-100">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full text-brand-gray-400 hover:bg-brand-gray-100 dark:hover:bg-brand-gray-700" aria-label="Close">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT"
              required
            />
          </div>
          <div>
            <label htmlFor="password"className="block text-sm font-medium text-brand-gray-700 dark:text-brand-gray-300">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-brand-gray-300 dark:border-brand-gray-600 bg-white dark:bg-brand-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-brand-gold-DEFAULT focus:border-brand-gold-DEFAULT"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-gold-dark hover:bg-brand-success-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-gold-dark disabled:bg-brand-gray-400"
            >
              {isLoading ? 'Processing...' : buttonText}
            </button>
          </div>
          <p className="text-sm text-center text-brand-gray-500 dark:text-brand-gray-400">
            {switchText}{' '}
            <button type="button" onClick={switchMode} className="font-medium text-brand-gold-dark dark:text-brand-gold-light hover:underline">
              {switchActionText}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default AuthModal;